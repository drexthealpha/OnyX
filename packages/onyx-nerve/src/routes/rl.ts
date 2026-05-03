import { Hono } from "hono";

const router = new Hono();

router.post("/outcome", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const mod = await import("@onyx/rl");
    await mod.recordOutcome(body);
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/metrics", async (c) => {
  try {
    const mod = await import("@onyx/rl");
    const result = await mod.getMetrics();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/policy", async (c) => {
  try {
    const mod = await import("@onyx/rl");
    const result = await mod.getCurrentPolicy();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;