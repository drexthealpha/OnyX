import { randomUUID } from "node:crypto";
import { insertTrajectory } from "../db.js";
/**
 * Build a Trajectory from raw conversation telemetry.
 * Called by POST /capture handler.
 */
export function buildTrajectory(telemetry) {
    return {
        id: randomUUID(),
        conversationId: telemetry.conversationId,
        message: telemetry.message,
        response: telemetry.response,
        toolsUsed: telemetry.toolsUsed ?? [],
        latencyMs: telemetry.latencyMs,
        tokensUsed: telemetry.tokensUsed,
        timestamp: Date.now(),
    };
}
/**
 * Persist a trajectory to better-sqlite3.
 * Idempotent — duplicate IDs are silently ignored (INSERT OR IGNORE).
 */
export function saveTrajectory(t) {
    insertTrajectory(t);
}
//# sourceMappingURL=conversation.js.map