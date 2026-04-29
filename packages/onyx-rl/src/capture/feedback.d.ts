import type { FeedbackPayload } from "../types.js";
/**
 * Record a user thumbs-up / thumbs-down for a trajectory.
 * Returns false if the trajectoryId does not exist.
 */
export declare function recordFeedback(payload: FeedbackPayload): {
    ok: boolean;
    error?: string;
};
//# sourceMappingURL=feedback.d.ts.map