import { FastifyRedis } from "@fastify/redis";
import ky from "ky";
import _ from "lodash";
import { ProductKeyUnion, ProductType } from "./schema.js";

const { PRODUCT_LOOKUP_API_ENDPOINT } = process.env;

/*
  cache-aside method that gets from cache and sets from data
*/
export const get = async (
  redis: FastifyRedis,
  productsToGet: Array<typeof ProductKeyUnion>,
): Promise<ProductType[]> => {
  // transforms { rsd: "my id" } | { rpn: "my id" } into "rsd:my_id", "rpn:my_id"
  const productKeys = productsToGet.map(productToStringKey);

  // get data from cache
  const cachedProducts = (await redis.mget(productKeys)).map((p) =>
    p ? JSON.parse(p) : null,
  ) as Array<ProductType | null>;

  const missedKeys = cachedProducts
    .map((product, index) => (product === null ? productKeys[index] : null))
    .filter((value) => value !== null) as ProductStringKey[];

  if (missedKeys.length > 0) {
    const json = {
      banner_id: 1,
      products: { ...missedKeys.map(stringKeyToProduct) },
    };
    const productLookup = await ky
      .post(PRODUCT_LOOKUP_API_ENDPOINT, { json, timeout: 60000 })
      .json<{ data: { products: ProductType[] } }>();

    const toAddToCache: { [k: ProductStringKey]: string } = {};
    for (let product of productLookup.data.products) {
      toAddToCache[productToStringKey(product)] = JSON.stringify(
        _.pick(product, "rpn", "rsd", "upc", "brand", "image_url"),
      );
    }
    redis.mset(toAddToCache);

    /*
    // if the lookup API proves to be a bottleneck,
    // we can use jobs to fetch data on miss
    const jobs = await queue.addBulk(
      missedKeys.map((key) => ({
        name: "product_lookup",
        data: { key },
        opts: { jobId: `${key.substring(0, 3)}__${key.substring(4)}` },
      })),
    );
    await Promise.all(jobs.map((job) => job.waitUntilFinished));
    */

    // get data that was missed from cache
    const missedCache = (await redis.mget(missedKeys)).map((p) =>
      p ? JSON.parse(p) : null,
    ) as Array<ProductType | null>;

    // fill products with items from missed cache
    const products = cachedProducts.map((product) =>
      product === null ? missedCache.shift() : product,
    ) as Array<ProductType>;
    return products;
  } else {
    return cachedProducts as Array<ProductType>;
  }
};

type ProductStringKey = `${"rpn" | "rsd"}:${string}`;

const productToStringKey = (
  p: typeof ProductKeyUnion | ProductType,
): ProductStringKey => {
  const key = "rpn" in p ? `rpn:${p.rpn}` : `rsd:${p.rsd}`;
  return key.replace(/ /g, "_") as ProductStringKey;
};

const stringKeyToProduct = (key: ProductStringKey) => {
  const prop = key.substring(0, 3);
  if (prop === "rpn") {
    return { rpn: key.substring(4) };
  } else if (prop === "rsd") {
    return { rsd: key.substring(4) };
  }
};
