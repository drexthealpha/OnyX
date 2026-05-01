import { Hono } from "hono";
const router = new Hono();
router.get("/", async (c) => {
    try {
        const mod = await import("@onyx/multica");
        const result = await mod.listChannels();
        return c.json(result);
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
router.post("/", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { name } = body;
    try {
        const mod = await import("@onyx/multica");
        const result = await mod.createChannel(name);
        return c.json(result);
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
router.post("/:id/send", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const { message } = body;
    try {
        const mod = await import("@onyx/multica");
        await mod.sendMessage(id, message);
        return c.json({ ok: true });
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
router.delete("/:id", async (c) => {
    const id = c.req.param("id");
    try {
        const mod = await import("@onyx/multica");
        await mod.deleteChannel(id);
        return c.json({ ok: true });
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
export default router;
