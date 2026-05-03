import { Hono } from "hono";

const router = new Hono();

router.post("/run", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { topic } = body as { topic?: string };
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/intel");
    const result = await mod.runIntel(topic || "");
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/news", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/intel");
    const result = await mod.getLatestIntel();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/trending", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/intel");
    const result = await mod.getTrendingTopics();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/brief", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { topic } = body as { topic?: string };
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/intel");
    const result = await mod.generateBrief(topic || "");
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/cache", async (c) => {
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/intel");
    const result = await mod.listCachedTopics();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.delete("/cache/:key", async (c) => {
  const key = c.req.param("key");
  try {
    // @ts-ignore - dynamic import of workspace package
    const mod = await import("@onyx/intel");
    await mod.evictCache(key);
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;