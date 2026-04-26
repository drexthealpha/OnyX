import { Hono } from "hono";

const router = new Hono();

router.get("/", async (c) => {
  try {
    const mod = await import("@onyx/agent");
    const result = await mod.listAgents();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const mod = await import("@onyx/agent");
    const result = await mod.getAgent(id);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, config } = body as { name?: string; config?: unknown };
  try {
    const mod = await import("@onyx/agent");
    const result = await mod.createAgent(name, config);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/:id/run", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const { prompt } = body as { prompt?: string };
  try {
    const mod = await import("@onyx/agent");
    const result = await mod.runAgent(id, prompt);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const mod = await import("@onyx/agent");
    await mod.deleteAgent(id);
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;