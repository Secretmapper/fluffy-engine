import { FastifyInstance } from "fastify/types/instance.js";
import { Type } from "@sinclair/typebox";
import { ProductKeyUnion, ProductList, ProductType } from "./lookup/schema.js";
import { get } from "./lookup/cache.js";

export const routes = (
  fastify: FastifyInstance,
  _opts: Object,
  next: Function,
) => {
  fastify.setErrorHandler((err, _req, reply) => {
    fastify.log.error(err);
    reply.status(500).send({ ok: false });
  });

  fastify.post<{
    Body: { products: Array<typeof ProductKeyUnion> };
    Reply: { products: ProductType[] };
  }>(
    "/v1/lookup",
    {
      schema: {
        body: {
          products: Type.Array(ProductKeyUnion),
        },
        response: {
          200: {
            products: ProductList,
          },
        },
      },
    },
    /*
      handler for getting data from the product lookup api
      we use a cache-aside strategy, fetching from cache and populating on miss
    */
    async function handler(req, _reply) {
      const { redis } = fastify;

      const products = await get(redis, req.body.products);
      return { products };
    },
  );

  next();
};
