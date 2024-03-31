declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      REDIS_HOST: string;
      REDIS_PASSWORD: string;
      REDIS_PORT: number;
      SCAN_LOOKUP_API_ENDPOINT: string;
      PRODUCT_LOOKUP_API_ENDPOINT: string;
    }
  }
}
export {};
