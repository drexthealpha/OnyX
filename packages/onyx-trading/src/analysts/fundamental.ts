/**
 * Fundamental analyst — on-chain metrics via Helius
 * Operator cost: $0 — user provides HELIUS_API_KEY
 */

import { fetchTokenMetadata, fetchTransactionStats } from '../data/helius.js';
import { fetchTokenOverview } from '../data/birdeye.js';
import { FundamentalAnalysis } from '../types.js';

export async function analyzeFundamentals(token: string): Promise<FundamentalAnalysis> {
  const [meta, txStats, overview] = await Promise.all([
    fetchTokenMetadata(token).catch(() => null),
    fetchTransactionStats(token).catch(() => null),
    fetchTokenOverview(token).catch(() => null),
  ]);

  const holders = meta?.holders ?? overview?.holders ?? 0;
  const transactions24h = txStats?.count24h ?? 0;
  const volume24h = overview?.volume24h ?? 0;
  const marketCap = overview?.marketCap ?? 0;

  let score = 0;
  if (holders > 10000) score += 1;
  if (holders > 100000) score += 1;
  if (transactions24h > 1000) score += 1;
  if (volume24h > 1_000_000) score += 1;
  if (marketCap > 10_000_000) score += 1;
  if (meta?.mintAuthority !== null) score -= 2;

  const maxScore = 5;
  const confidence = Math.min(1, Math.max(0, score / maxScore));

  let signal: 'BUY' | 'SELL' | 'HOLD';
  if (score >= 3) signal = 'BUY';
  else if (score <= 0) signal = 'SELL';
  else signal = 'HOLD';

  return {
    token,
    mintAddress: token,
    holders,
    transactions24h,
    volume24h,
    marketCap,
    signal,
    confidence,
    timestamp: Date.now(),
  };
}