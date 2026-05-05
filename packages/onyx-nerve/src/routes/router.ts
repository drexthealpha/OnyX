import { Hono } from "hono";

const router = new Hono();

router.post("/route", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { prompt, tier } = body as { prompt?: string; tier?: string };
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/router");
    const budget: unknown = { userId: "default", maxCostPerRequestUSD: 0.1 };
    const result = await mod.routeRequest(prompt ?? "", budget);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/providers", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/router");
    const result = await mod.listProviders();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/meter", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/router");
    await mod.checkBudget(body.userId ?? "");
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/budget", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/router");
    const result = await mod.getBudgetStatus();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

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
    const result = await (mod as any).executeTrade(body);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/positions", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/trading");
    const result = await (mod as any).getPositions();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/history", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/trading");
    const result = await (mod as any).getTradeHistory();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;