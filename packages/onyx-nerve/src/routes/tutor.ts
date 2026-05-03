import { Hono } from "hono";

const router = new Hono();

router.post("/ask", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { question, sessionId } = body as { question?: string; sessionId?: string };
  try {
    const { ask } = await import("@onyx/tutor");
    const result = await ask(question, sessionId);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/quiz", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const { generateQuizLibrary } = await import("@onyx/tutor");
    const result = await generateQuizLibrary(body.topic, body.level);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/progress/:userId", async (c) => {
  const userId = c.req.param("userId");
  try {
    const { getUserProgress } = await import("@onyx/tutor");
    const result = await getUserProgress(userId);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/feedback", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const { recordFeedback } = await import("@onyx/tutor");
    const result = await recordFeedback(body);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/sessions", async (c) => {
  try {
    const { listSessions } = await import("@onyx/tutor");
    const result = await listSessions();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.delete("/sessions/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const { deleteSession } = await import("@onyx/tutor");
    await deleteSession(id);
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;