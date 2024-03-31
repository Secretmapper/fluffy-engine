import { FastifyRedis } from "@fastify/redis";
import { ScanReceiptType } from "./schema.js";

export const get = async (
  redis: FastifyRedis,
  id: string,
): Promise<ScanReceiptType | null> => {
  const item = await redis.get(id);
  if (item === null) return null;
  return JSON.parse(item);
};

export const set = async (
  redis: FastifyRedis,
  id: string,
  data: ScanReceiptType,
) => {
  return await redis.set(id, JSON.stringify(data));
};
