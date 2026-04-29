import type { Trajectory, Reward } from "../types.js";
/**
 * Compute a Reward for a given Trajectory.
 *
 * Formula (from OpenClaw-RL):
 *   base          = outcome.success ? 1.0 : 0.0  (default 0.5 if no outcome)
 *   feedback      = thumbsUp ? +0.5 : thumbsDown ? -0.5 : 0
 *   latencyPenalty= -0.1 per second over 2000ms
 *   tokenPenalty  = -0.01 per 100 tokens over 1000
 *   final         = clamp(base + feedback + latency + token, 0, 1)
 */
export declare function compute(trajectory: Trajectory, outcome?: {
    success: boolean;
}): Reward;
//# sourceMappingURL=model.d.ts.map