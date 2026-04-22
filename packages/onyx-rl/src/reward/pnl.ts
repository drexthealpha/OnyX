/**
 * Compute a trading reward from an array of trade returns.
 *
 * Uses annualised Sharpe ratio (√252 scaling convention, daily returns).
 * Maps to [0, 1] via sigmoid so the reward is always a valid probability-like score.
 */
export function computeTradingReward(trades: Array<{ return: number }>): number {
  if (trades.length === 0) return 0.5; // no data → neutral

  const returns = trades.map(t => t.return);
  const n = returns.length;

  // Mean
  const mean = returns.reduce((s, r) => s + r, 0) / n;

  // Standard deviation (population)
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Annualised Sharpe (assume daily returns, 252 trading days/year)
  const sharpe = stdDev === 0 ? 0 : (mean / stdDev) * Math.sqrt(252);

  // Sigmoid to map ℝ → (0, 1)
  return sigmoid(sharpe);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}