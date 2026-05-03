import { Hono } from "hono";

const router = new Hono();

router.get("/stats", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/trading");
    const result = await mod.getStats();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/trade", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/trading");
    const result = await mod.executeTrade(body);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/positions", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/trading");
    const result = await mod.getPositions();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/history", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/trading");
    const result = await mod.getTradeHistory();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;