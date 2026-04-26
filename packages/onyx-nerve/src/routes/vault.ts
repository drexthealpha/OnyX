import { Hono } from "hono";

const router = new Hono();

router.get("/balance", async (c) => {
  try {
    const mod = await import("@onyx/vault");
    const result = await mod.getBalance();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.post("/sign", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { transaction } = body as { transaction?: string };
  try {
    const mod = await import("@onyx/vault");
    const result = await mod.signTransaction(transaction);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

router.get("/history", async (c) => {
  try {
    const mod = await import("@onyx/vault");
    const result = await mod.getTransactionHistory();
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err), fallback: true }, 503);
  }
});

export default router;