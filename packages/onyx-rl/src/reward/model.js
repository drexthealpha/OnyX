import { getOutcome, getFeedback } from "../db.js";
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
export function compute(trajectory, outcome) {
    // ── 1. Base: completion signal ─────────────────────────────────────────────
    const storedOutcome = getOutcome(trajectory.id);
    const effectiveOutcome = outcome ?? (storedOutcome ? { success: storedOutcome.success } : undefined);
    let completion;
    if (effectiveOutcome === undefined) {
        completion = 0.5; // no outcome yet — neutral
    }
    else {
        completion = effectiveOutcome.success ? 1.0 : 0.0;
    }
    // ── 2. Feedback modifier ───────────────────────────────────────────────────
    const storedFeedback = getFeedback(trajectory.id);
    let feedback = 0;
    if (storedFeedback) {
        feedback = storedFeedback.thumbsUp ? 0.5 : -0.5;
    }
    // ── 3. Latency penalty: -0.1 per second over 2000ms ───────────────────────
    const excessMs = Math.max(0, trajectory.latencyMs - 2000);
    const latency = -(excessMs / 1000) * 0.1;
    // ── 4. Token efficiency penalty: -0.01 per 100 tokens over 1000 ───────────
    const excessTokens = Math.max(0, trajectory.tokensUsed - 1000);
    const efficiency = -(Math.floor(excessTokens / 100)) * 0.01;
    // ── 5. Final clamped reward ────────────────────────────────────────────────
    const raw = completion + feedback + latency + efficiency;
    const value = Math.min(1, Math.max(0, raw));
    return {
        trajectoryId: trajectory.id,
        value,
        components: { completion, feedback, latency, efficiency },
    };
}
//# sourceMappingURL=model.js.map