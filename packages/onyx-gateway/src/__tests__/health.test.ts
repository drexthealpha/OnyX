import { describe, test, expect } from "bun:test";

describe("GET /health", () => {
  test("returns 200 with status ok", async () => {
    const { Hono } = await import("hono");
    const app = new Hono();
    app.get("/health", (c) => c.json({ status: "ok", uptime: process.uptime() }));

    const req = new Request("http://localhost/health");
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});