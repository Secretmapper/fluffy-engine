import "dotenv/config";

import Fastify from "fastify";
import redis from "@fastify/redis";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { Redis } from "ioredis";

import { routes } from "./routes/index.js";

const { PORT, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } = process.env;

const fastify = Fastify({ logger: true });

const client = new Redis({
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  port: REDIS_PORT,
});

fastify.register(redis, { client, closeClient: true });
fastify.register(swagger);
fastify.register(swaggerUI, { routePrefix: "/documentation" });
fastify.addContentTypeParser(
  "multipart/form-data",
  function setMultipart(_req, _payload, done) {
    done(null);
  },
);

fastify.get("/", async function handler(_req, _reply) {
  return { hello: "world" };
});

fastify.register(routes, { prefix: "/api" });

fastify.listen({ host: "0.0.0.0", port: PORT }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});