import type { MiddlewareHandler } from "hono";

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const origins = process.env.NERVE_ALLOWED_ORIGINS ?? "*";
  const origin = c.req.header("Origin") ?? "*";
  const allowed = origins === "*" || origins.split(",").map(s => s.trim()).includes(origin);

  c.header("Access-Control-Allow-Origin", allowed ? origin : "");
  c.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Vary", "Origin");

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }
  return next();
};