import { test, expect, describe, beforeAll, afterAll } from "vitest";
// Test 1 — GET /health returns 200
describe("Health endpoint", () => {
    test("GET /health returns 200 with { status: 'ok' }", async () => {
        const { app } = await import("../index.ts");
        const res = await app.request("/health");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toMatchObject({ status: "ok" });
    });
});
// Test 2 — SSE endpoint responds with text/event-stream
describe("SSE endpoint", () => {
    test("GET /events responds with text/event-stream content-type", async () => {
        const { app } = await import("../index.ts");
        const res = await app.request("/events");
        expect(res.status).toBe(200);
        const ct = res.headers.get("content-type") ?? "";
        expect(ct).toContain("text/event-stream");
    });
});
// Test 3 — All route files export a Hono router as default export
describe("Route modules", () => {
    test("All 10 route files export a Hono instance with .fetch method", async () => {
        const routers = await Promise.all([
            import("../routes/agents.ts"),
            import("../routes/channels.ts"),
            import("../routes/plugins.ts"),
            import("../routes/trading.ts"),
            import("../routes/research.ts"),
            import("../routes/vault.ts"),
            import("../routes/router.ts"),
            import("../routes/rl.ts"),
            import("../routes/intel.ts"),
            import("../routes/tutor.ts"),
        ]);
        for (const mod of routers) {
            const router = mod.default;
            expect(typeof router.fetch).toBe("function");
        }
    });
});
// Test 4 — Auth middleware blocks requests when ONYX_NERVE_TOKEN is set
describe("Auth middleware", () => {
    const originalToken = process.env.ONYX_NERVE_TOKEN;
    beforeAll(() => { process.env.ONYX_NERVE_TOKEN = "test-secret"; });
    afterAll(() => {
        if (originalToken === undefined)
            delete process.env.ONYX_NERVE_TOKEN;
        else
            process.env.ONYX_NERVE_TOKEN = originalToken;
    });
    test("401 without Authorization header", async () => {
        const { Hono } = await import("hono");
        const { authMiddleware } = await import("../middleware/auth.ts");
        const app = new Hono();
        app.use("*", authMiddleware);
        app.get("/", (c) => c.json({ ok: true }, 200));
        const res = await app.request("/");
        expect(res.status).toBe(401);
    });
    test("200 with correct Bearer token", async () => {
        const { Hono } = await import("hono");
        const { authMiddleware } = await import("../middleware/auth.ts");
        const app = new Hono();
        app.use("*", authMiddleware);
        app.get("/", (c) => c.json({ ok: true }, 200));
        const res = await app.request("/", {
            headers: { Authorization: "Bearer test-secret" },
        });
        expect(res.status).toBe(200);
    });
});
// Test 5 — broadcastEvent sends to all connected SSE clients
describe("broadcastEvent", () => {
    test("formats and sends correct SSE data string to all connected clients", async () => {
        const { broadcastEvent, writers } = await import("../sse.ts");
        const written = [];
        const fakeWriter = { write: (chunk) => { written.push(chunk); } };
        writers.add(fakeWriter);
        broadcastEvent("intel", { topic: "test" });
        writers.delete(fakeWriter);
        expect(written.length).toBeGreaterThan(0);
        const payload = written.join("");
        expect(payload).toContain("event: intel");
        expect(payload).toContain('"topic":"test"');
        expect(payload).toContain("data:");
    });
});
