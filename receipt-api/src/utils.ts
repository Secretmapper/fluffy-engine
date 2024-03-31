import { FastifyRequest } from "fastify";
import http from "node:http";

export function pipeRequest<Type = unknown>(
  req: FastifyRequest,
  url: string,
  options: http.RequestOptions,
): Promise<Type> {
  return new Promise((resolve, reject) => {
    req.raw.pipe(
      http.request(url, options, (res) => {
        let rawBody = "";
        res.on("readable", function () {
          rawBody += res.read();
        });
        res.on("end", function () {
          try {
            const body = JSON.parse(rawBody);
            if (res.statusCode == 200) {
              resolve(body);
            } else {
              reject(body);
            }
          } catch (e) {
            reject(e);
          }
        });
      }),
    );
  });
}
