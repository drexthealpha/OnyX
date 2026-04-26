import { pino } from "pino";
import type { MiddlewareHandler } from "hono";

const log = pino({ name: "onyx-nerve" });

export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  const path = new URL(c.req.url).pathname;
  if (path === "/health") return;
  log.info({
    method: c.req.method,
    path,
    status: c.res.status,
    durationMs: Date.now() - start,
  });
};