import { FastifyInstance } from "fastify/types/instance.js";
import { Type } from "@sinclair/typebox";
import { v4 as uuid } from "uuid";
import ky from "ky";
import { pipeRequest } from "../utils.js";
import * as cache from "./scan_receipt/cache.js";
import { ScanReceipt, ScanReceiptType } from "./scan_receipt/schema.js";

const { SCAN_LOOKUP_API_ENDPOINT, PRODUCT_LOOKUP_API_ENDPOINT } = process.env;

export const routes = (
  fastify: FastifyInstance,
  _opts: Object,
  next: Function,
) => {
  fastify.setErrorHandler((err, _req, reply) => {
    fastify.log.error(err);
    reply.status(500).send({ ok: false });
  });

  const scanReceiptSchema = {
    schema: {
      querystring: {
        id: Type.String({
          description: "unique identifier for previously scanned receipt",
        }),
      },
      response: {
        200: ScanReceipt,
      },
    },
  };

  fastify.get<{
    Querystring: { id: string };
  }>(
    "/v1/scan_receipt",
    // scanReceiptSchema,
    async function handler(req, reply) {
      const receipt_id = req.query.id;
      const scanData = await cache.get(fastify.redis, receipt_id);
      if (scanData) {
        return { receipt_id, ...scanData };
      } else {
        return reply.callNotFound();
      }
    },
  );

  fastify.post("/v1/scan_receipt", async function handler(req, reply) {
    // let's make sure to simply pipe data here and not load/parse anything
    try {
      const scanData = await pipeRequest<ScanReceiptType>(
        req,
        SCAN_LOOKUP_API_ENDPOINT,
        { method: "POST", headers: req.headers },
      );

      const products = scanData.products.map((p) =>
        "rpn" in p ? { rpn: p.rpn.value } : { rsd: p.rsd.value },
      );

      const lookupResults = await ky
        .post(PRODUCT_LOOKUP_API_ENDPOINT, {
          json: { products },
          timeout: 60000
        })
        .json<{ products: [] }>();

      for (let i = 0; i < scanData.products.length; i++) {
        const product = scanData.products[i];
        if ("rpn" in product) {
          product.rpn.value = lookupResults.products[i];
        } else if ("rsd" in product) {
          product.rsd.value = lookupResults.products[i];
        }
      }

      const receipt_id = uuid();
      await cache.set(fastify.redis, receipt_id, scanData);
      return { receipt_id, ...scanData };
    } catch (e) {
      reply.status(500).send(e);
    }
  });

  next();
};
