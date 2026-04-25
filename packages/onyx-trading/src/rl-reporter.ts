/**
 * RL reporter — reports trade outcomes to the RL module for reinforcement learning
 * Computes Sharpe ratio over last 30 trades
 * Posts to POST http://localhost:${RL_PORT}/outcome
 */

import axios from 'axios';
import { CompletedTrade } from './types.js';
import { getLastNTrades } from './portfolio.js';

function computeSharpe(returns: number[], riskFreeRate = 0.05 / 365): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return (mean - riskFreeRate) / std;
}

export async function reportTrade(trade: CompletedTrade): Promise<void> {
  const rlPort = process.env.RL_PORT ?? '4000';
  const rlUrl = `http://localhost:${rlPort}/outcome`;

  const recentTrades = getLastNTrades(30);
  const returns = recentTrades
    .filter(t => t.pnlPct !== undefined)
    .map(t => t.pnlPct!);

  const sharpe = computeSharpe(returns);
  const winRate = returns.filter(r => r > 0).length / Math.max(1, returns.length);
  const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;

  const payload = {
    tradeId: `${trade.token}-${trade.timestamp}`,
    token: trade.token,
    action: trade.action,
    pnlUsd: trade.pnlUsd ?? 0,
    pnlPct: trade.pnlPct ?? 0,
    metrics: {
      sharpe30d: sharpe,
      winRate30d: winRate,
      avgReturn30d: avgReturn,
      tradeCount: recentTrades.length,
    },
    timestamp: trade.timestamp,
    source: 'onyx-trading',
  };

  axios.post(rlUrl, payload, { timeout: 2000 }).catch(() => {
    // RL module may not be running — silently ignore
  });
}