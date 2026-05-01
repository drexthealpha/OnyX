import { Hono } from "hono";
const router = new Hono();
router.get("/price/:token", async (c) => {
    const token = c.req.param("token");
    try {
        const mod = await import("@onyx/trading");
        const result = await mod.getPrice(token);
        return c.json({ token, price: result, timestamp: Date.now() });
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
router.post("/analyze", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { token } = body;
    try {
        const mod = await import("@onyx/trading");
        const result = await mod.runAnalysis(token);
        return c.json(result);
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
router.get("/portfolio", async (c) => {
    try {
        const mod = await import("@onyx/trading");
        const result = await mod.getPortfolio();
        return c.json(result);
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
router.post("/backtest", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { token, days } = body;
    try {
        const mod = await import("@onyx/trading");
        const result = await mod.runBacktest(token, days);
        return c.json(result);
    }
    catch (err) {
        return c.json({ error: String(err), fallback: true }, 503);
    }
});
export default router;
