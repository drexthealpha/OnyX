import { Hono } from "hono";

const router = new Hono();

router.post("/run", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { topic } = body as { topic?: string };
  try {
    const mod = await import("@onyx/research");
    const result = await mod.runResearch(topic ?? "");
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/schedule", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { topic, deliverAt } = body as { topic?: string; deliverAt?: string };
  try {
    const mod = await import("@onyx/research");
    const result = await mod.scheduleResearch(topic ?? "", new Date(deliverAt ?? Date.now()));
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/jobs", async (c) => {
  try {
    const mod = await import("@onyx/research");
    const result = await (mod as any).listScheduledJobs();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;