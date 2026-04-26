import { Hono } from "hono";

const router = new Hono();

router.post("/ask", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { question, sessionId } = body as { question?: string; sessionId?: string };
  try {
    const mod = await import("@onyx/tutor");
    const result = await mod.ask(question, sessionId);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/sessions", async (c) => {
  try {
    const mod = await import("@onyx/tutor");
    const result = await mod.listSessions();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.delete("/sessions/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const mod = await import("@onyx/tutor");
    await mod.deleteSession(id);
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;