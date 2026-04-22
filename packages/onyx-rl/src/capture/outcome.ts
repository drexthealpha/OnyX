import type { OutcomePayload, OutcomeRecord } from "../types.js";
import { insertOutcome, getTrajectory } from "../db.js";

/**
 * Record a task completion outcome for a trajectory.
 * Returns false if the trajectoryId does not exist.
 */
export function recordOutcome(payload: OutcomePayload): { ok: boolean; error?: string } {
  const traj = getTrajectory(payload.trajectoryId);
  if (!traj) {
    return { ok: false, error: `Trajectory ${payload.trajectoryId} not found` };
  }

  const record: OutcomeRecord = {
    trajectoryId: payload.trajectoryId,
    success: payload.success,
    details: payload.details,
    recordedAt: Date.now(),
  };
  insertOutcome(record);
  return { ok: true };
}