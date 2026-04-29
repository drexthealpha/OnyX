import type { OutcomePayload } from "../types.js";
/**
 * Record a task completion outcome for a trajectory.
 * Returns false if the trajectoryId does not exist.
 */
export declare function recordOutcome(payload: OutcomePayload): {
    ok: boolean;
    error?: string;
};
//# sourceMappingURL=outcome.d.ts.map