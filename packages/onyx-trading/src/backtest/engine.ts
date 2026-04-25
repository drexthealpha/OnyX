/**
 * Backtest engine — replays historical candles without live API calls
 * Tracks equity curve, trade log
 */

import { OHLCV, TradeSignal, BacktestResult } from '../types.js';

export interface BacktestConfig {
  startingEquity: number;
  commissionBps: number;
  slippageBps: number;
}

const DEFAULT_CONFIG: BacktestConfig = {
  startingEquity: 10000,
  commissionBps: 10,
  slippageBps: 20,
};

export interface BacktestTrade {
  index: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  equity: number;
  size: number;
}

export async function run(
  strategyFn: (candle: OHLCV, index: number, history: OHLCV[]) => TradeSignal,
  candles: OHLCV[],
  config: Partial<BacktestConfig> = {},
): Promise<BacktestResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { commissionBps, slippageBps } = cfg;
  const commissionRate = commissionBps / 10000;
  const slippageRate = slippageBps / 10000;

  let cashUsd = cfg.startingEquity;
  let tokenAmount = 0;
  let currentPrice = 0;

  const equityCurve: number[] = [];
  const trades: BacktestTrade[] = [];
  const equityReturns: number[] = [];

  let lastEquity = cfg.startingEquity;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    currentPrice = candle.close;

    const signal = strategyFn(candle, i, candles.slice(0, i + 1));
    const totalEquity = cashUsd + tokenAmount * currentPrice;

    if (signal.action === 'BUY' && signal.size > 0 && cashUsd > 0) {
      const buyValueUsd = totalEquity * Math.min(signal.size, 1);
      const actualBuyUsd = Math.min(buyValueUsd, cashUsd);
      const effectivePrice = currentPrice * (1 + slippageRate);
      const commission = actualBuyUsd * commissionRate;
      const netBuy = actualBuyUsd - commission;

      if (netBuy > 0 && effectivePrice > 0) {
        tokenAmount += netBuy / effectivePrice;
        cashUsd -= actualBuyUsd;

        trades.push({ index: i, action: 'BUY', price: effectivePrice, equity: totalEquity, size: signal.size });
      }
    } else if (signal.action === 'SELL' && tokenAmount > 0) {
      const sellTokens = tokenAmount * Math.min(signal.size, 1);
      const effectivePrice = currentPrice * (1 - slippageRate);
      const sellValueUsd = sellTokens * effectivePrice;
      const commission = sellValueUsd * commissionRate;

      cashUsd += sellValueUsd - commission;
      tokenAmount -= sellTokens;

      trades.push({ index: i, action: 'SELL', price: effectivePrice, equity: totalEquity, size: signal.size });
    }

    const equity = cashUsd + tokenAmount * currentPrice;
    equityCurve.push(equity);

    if (i > 0) {
      equityReturns.push((equity - lastEquity) / lastEquity);
    }
    lastEquity = equity;
  }

  const finalEquity = equityCurve[equityCurve.length - 1] ?? cfg.startingEquity;
  const totalReturn = (finalEquity - cfg.startingEquity) / cfg.startingEquity;

  let maxDrawdown = 0;
  let peak = equityCurve[0] ?? cfg.startingEquity;
  for (const eq of equityCurve) {
    if (eq > peak) peak = eq;
    const drawdown = (eq - peak) / peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }

  const { sharpe, sortino } = computeRatios(equityReturns);

  const buyTrades = trades.filter(t => t.action === 'BUY');
  const sellTrades = trades.filter(t => t.action === 'SELL');
  const completedPairs = Math.min(buyTrades.length, sellTrades.length);
  let wins = 0;
  for (let i = 0; i < completedPairs; i++) {
    if (sellTrades[i].price > buyTrades[i].price) wins++;
  }

  return {
    startEquity: cfg.startingEquity,
    endEquity: finalEquity,
    totalReturn,
    sharpe,
    sortino,
    maxDrawdown,
    totalTrades: trades.length,
    winRate: completedPairs > 0 ? wins / completedPairs : 0,
    equityCurve,
    trades,
  };
}

function computeRatios(returns: number[]): { sharpe: number; sortino: number } {
  if (returns.length < 2) return { sharpe: 0, sortino: 0 };

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const std = Math.sqrt(variance);

  const downside = returns.filter(r => r < 0);
  const downsideVariance = downside.length > 1
    ? downside.reduce((s, r) => s + r * r, 0) / (downside.length - 1)
    : 0;
  const downsideStd = Math.sqrt(downsideVariance);

  const riskFreePerPeriod = 0.05 / 365;

  const sharpe = std > 0 ? (mean - riskFreePerPeriod) / std : 0;
  const sortino = downsideStd > 0 ? (mean - riskFreePerPeriod) / downsideStd : 0;

  return { sharpe, sortino };
}