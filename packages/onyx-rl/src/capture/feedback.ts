import type { FeedbackPayload, FeedbackRecord } from "../types.js";
import { insertFeedback, getTrajectory } from "../db.js";

/**
 * Record a user thumbs-up / thumbs-down for a trajectory.
 * Returns false if the trajectoryId does not exist.
 */
export function recordFeedback(payload: FeedbackPayload): { ok: boolean; error?: string } {
  const traj = getTrajectory(payload.trajectoryId);
  if (!traj) {
    return { ok: false, error: `Trajectory ${payload.trajectoryId} not found` };
  }

  const record: FeedbackRecord = {
    trajectoryId: payload.trajectoryId,
    thumbsUp: payload.thumbsUp,
    recordedAt: Date.now(),
  };
  insertFeedback(record);
  return { ok: true };
}