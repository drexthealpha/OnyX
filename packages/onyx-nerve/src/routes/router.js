import { Hono } from "hono";
const router = new Hono();
router.post("/route", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { prompt, tier } = body;
    try {
        const mod = await import("@onyx/router");
        const result = await mod.routeRequest(prompt, tier);
        return c.json(result);
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
router.get("/providers", async (c) => {
    try {
        const mod = await import("@onyx/router");
        const result = await mod.listProviders();
        return c.json(result);
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
router.get("/budget", async (c) => {
    try {
        const mod = await import("@onyx/router");
        const result = await mod.getBudgetStatus();
        return c.json(result);
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
export default router;
