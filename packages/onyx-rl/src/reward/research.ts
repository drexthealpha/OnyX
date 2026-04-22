/**
 * Compute a research quality reward.
 *
 * Score components:
 *   citationScore = min(citationCount / 10, 1.0)   — saturates at 10 citations
 *   accuracyScore = clamp(accuracySignal, 0, 1)     — 0..1 float
 *   combined      = 0.4 * citationScore + 0.6 * accuracyScore
 *
 * Returns clamped value in [0, 1].
 */
export interface ResearchMetrics {
  citationCount: number;   // number of cited sources
  accuracySignal: number;  // 0.0 (wrong) → 1.0 (fully accurate)
}

export function computeResearchReward(metrics: ResearchMetrics): number {
  const citationScore = Math.min(metrics.citationCount / 10, 1.0);
  const accuracyScore = Math.min(1, Math.max(0, metrics.accuracySignal));
  const combined = 0.4 * citationScore + 0.6 * accuracyScore;
  return Math.min(1, Math.max(0, combined));
}