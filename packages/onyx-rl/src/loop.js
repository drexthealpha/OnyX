import { Hono } from "hono";
import { buildTrajectory, saveTrajectory } from "./capture/conversation.js";
import { recordOutcome } from "./capture/outcome.js";
import { recordFeedback } from "./capture/feedback.js";
import { getSkillAverageReward } from "./db.js";
import { maybeRunPipeline } from "./pipeline.js";
export const app = new Hono();
// ─── POST /capture ────────────────────────────────────────────────────────────
// Accepts ConversationTelemetry, stores as Trajectory, triggers pipeline check.
app.post("/capture", async (c) => {
    let body;
    try {
        body = await c.req.json();
    }
    catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }
    if (!body.conversationId || !body.message || !body.response) {
        return c.json({ error: "Missing required fields: conversationId, message, response" }, 400);
    }
    if (typeof body.latencyMs !== "number" || typeof body.tokensUsed !== "number") {
        return c.json({ error: "latencyMs and tokensUsed must be numbers" }, 400);
    }
    const trajectory = buildTrajectory(body);
    saveTrajectory(trajectory);
    // Non-blocking pipeline trigger
    maybeRunPipeline();
    return c.json({ ok: true, trajectoryId: trajectory.id }, 200);
});
// ─── POST /outcome ────────────────────────────────────────────────────────────
// Accepts { trajectoryId, success: boolean, details: string }.
app.post("/outcome", async (c) => {
    let body;
    try {
        body = await c.req.json();
    }
    catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }
    if (!body.trajectoryId || typeof body.success !== "boolean") {
        return c.json({ error: "Missing required fields: trajectoryId, success" }, 400);
    }
    const result = recordOutcome(body);
    if (!result.ok) {
        return c.json({ error: result.error }, 404);
    }
    return c.json({ ok: true }, 200);
});
// ─── POST /feedback ───────────────────────────────────────────────────────────
// Accepts { trajectoryId, thumbsUp: boolean }.
app.post("/feedback", async (c) => {
    let body;
    try {
        body = await c.req.json();
    }
    catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }
    if (!body.trajectoryId || typeof body.thumbsUp !== "boolean") {
        return c.json({ error: "Missing required fields: trajectoryId, thumbsUp" }, 400);
    }
    const result = recordFeedback(body);
    if (!result.ok) {
        return c.json({ error: result.error }, 404);
    }
    return c.json({ ok: true }, 200);
});
// ─── GET /score/:skillName ────────────────────────────────────────────────────
// Returns average reward score for a skill over last 50 uses.
app.get("/score/:skillName", c => {
    const skillName = c.req.param("skillName");
    if (!skillName) {
        return c.json({ error: "skillName is required" }, 400);
    }
    const averageReward = getSkillAverageReward(skillName);
    return c.json({ skill: skillName, averageReward, sampledFrom: "last_50_uses" }, 200);
});
// ─── GET /health ──────────────────────────────────────────────────────────────
app.get("/health", c => c.json({ status: "ok", service: "@onyx/rl" }, 200));
//# sourceMappingURL=loop.js.map