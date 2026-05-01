import { Hono } from "hono";
const PLUGINS = [
    { id: "agent", package: "@onyx/agent", status: "installed" },
    { id: "multica", package: "@onyx/multica", status: "installed" },
    { id: "vault", package: "@onyx/vault", status: "installed" },
    { id: "trading", package: "@onyx/trading", status: "installed" },
    { id: "research", package: "@onyx/research", status: "installed" },
    { id: "intel", package: "@onyx/intel", status: "installed" },
    { id: "router", package: "@onyx/router", status: "installed" },
    { id: "rl", package: "@onyx/rl", status: "installed" },
    { id: "tutor", package: "@onyx/tutor", status: "installed" },
    { id: "mem", package: "@onyx/mem", status: "installed" },
];
const router = new Hono();
router.get("/", async (c) => {
    return c.json(PLUGINS);
});
router.post("/:id/enable", async (c) => {
    const id = c.req.param("id");
    return c.json({ ok: true, plugin: id });
});
router.post("/:id/disable", async (c) => {
    const id = c.req.param("id");
    return c.json({ ok: true, plugin: id });
});
export default router;
