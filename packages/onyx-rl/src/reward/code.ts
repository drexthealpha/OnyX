/**
 * Compute a code quality reward.
 *
 * Score components:
 *   testPassRate  = passed / total              — 0..1
 *   lintPenalty   = -0.1 per lint error, min 0  — 0..1
 *   combined      = 0.8 * testPassRate + 0.2 * max(0, 1 - lintPenalty)
 *
 * Returns clamped value in [0, 1].
 */
export interface CodeMetrics {
  testsPassed: number;
  testsTotal: number;
  lintErrors?: number;
}

export function computeCodeReward(metrics: CodeMetrics): number {
  if (metrics.testsTotal === 0) return 0.5; // no tests → neutral

  const testPassRate = metrics.testsPassed / metrics.testsTotal;

  const lintErrors = metrics.lintErrors ?? 0;
  const lintPenalty = Math.min(1, lintErrors * 0.1);
  const lintScore = Math.max(0, 1 - lintPenalty);

  const combined = 0.8 * testPassRate + 0.2 * lintScore;
  return Math.min(1, Math.max(0, combined));
}