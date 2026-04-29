import type { ConversationTelemetry, Trajectory } from "../types.js";
/**
 * Build a Trajectory from raw conversation telemetry.
 * Called by POST /capture handler.
 */
export declare function buildTrajectory(telemetry: ConversationTelemetry): Trajectory;
/**
 * Persist a trajectory to better-sqlite3.
 * Idempotent — duplicate IDs are silently ignored (INSERT OR IGNORE).
 */
export declare function saveTrajectory(t: Trajectory): void;
//# sourceMappingURL=conversation.d.ts.map