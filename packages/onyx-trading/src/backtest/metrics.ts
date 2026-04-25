/**
 * Backtest metrics — Sharpe, Sortino, max drawdown, CAGR, Calmar
 */

export interface BacktestMetrics {
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  cagr: number;
  calmar: number;
  volatility: number;
  meanReturn: number;
  winRate: number;
}

export function computeMetrics(
  equityCurve: number[],
  trades: Array<{ action: string; price: number }>,
  periodDays = 365,
  riskFreeRate = 0.05,
): BacktestMetrics {
  if (equityCurve.length < 2) {
    return { sharpe: 0, sortino: 0, maxDrawdown: 0, cagr: 0, calmar: 0, volatility: 0, meanReturn: 0, winRate: 0 };
  }

  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push((equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1]);
  }

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / Math.max(1, returns.length - 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(periodDays);

  const rfPerPeriod = riskFreeRate / periodDays;
  const excessReturns = returns.map(r => r - rfPerPeriod);
  const exMean = excessReturns.reduce((s, r) => s + r, 0) / excessReturns.length;
  const exStd = Math.sqrt(
    excessReturns.reduce((s, r) => s + Math.pow(r - exMean, 2), 0) / Math.max(1, excessReturns.length - 1)
  );

  const sharpe = exStd > 0 ? (exMean / exStd) * Math.sqrt(periodDays) : 0;

  const downside = returns.filter(r => r < rfPerPeriod);
  const downsideVariance = downside.length > 1
    ? downside.reduce((s, r) => s + Math.pow(r - rfPerPeriod, 2), 0) / (downside.length - 1)
    : 0;
  const downsideStd = Math.sqrt(downsideVariance) * Math.sqrt(periodDays);
  const sortino = downsideStd > 0 ? ((mean * periodDays - riskFreeRate) / downsideStd) : 0;

  let maxDrawdown = 0;
  let peak = equityCurve[0];
  for (const eq of equityCurve) {
    if (eq > peak) peak = eq;
    const dd = (eq - peak) / peak;
    if (dd < maxDrawdown) maxDrawdown = dd;
  }

  const startEq = equityCurve[0];
  const endEq = equityCurve[equityCurve.length - 1];
  const years = returns.length / periodDays;
  const cagr = years > 0 ? Math.pow(endEq / startEq, 1 / years) - 1 : 0;

  const calmar = maxDrawdown < 0 ? cagr / Math.abs(maxDrawdown) : 0;

  const buys = trades.filter(t => t.action === 'BUY');
  const sells = trades.filter(t => t.action === 'SELL');
  const pairs = Math.min(buys.length, sells.length);
  const wins = Array.from({ length: pairs }, (_, i) => sells[i].price > buys[i].price ? 1 : 0)
    .reduce((s: number, v: number) => s + v, 0);
  const winRate = pairs > 0 ? wins / pairs : 0;

  return {
    sharpe,
    sortino,
    maxDrawdown,
    cagr,
    calmar,
    volatility,
    meanReturn: mean * periodDays,
    winRate,
  };
}