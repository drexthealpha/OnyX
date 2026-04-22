// packages/onyx-compute/src/nosana/markets.ts
//
// Market selection strategies.
//
// NOTE: The on-chain Market account does NOT include a latency field.
// For FASTEST strategy we use nodeXnosMinimum as a proxy for node quality
// (higher stake = better-provisioned nodes = lower effective latency).
// For BALANCED we use the price-to-stake ratio.

import { type Market } from '@nosana/kit';
import { getNosanaClient } from './client.js';

export type MarketStrategy = 'CHEAPEST' | 'FASTEST' | 'BALANCED';

/**
 * Select the best market from the Nosana marketplace according to strategy.
 *
 * - CHEAPEST  : lowest jobPrice
 * - FASTEST   : highest nodeXnosMinimum (better-staked nodes ≈ faster execution)
 * - BALANCED  : best price-to-stake ratio (jobPrice / nodeXnosMinimum)
 *
 * Only considers markets with NODE_QUEUE (queueType=1) where nodes are ready.
 *
 * @throws if no markets are available.
 */
export async function selectMarket(strategy: MarketStrategy): Promise<Market> {
  const client = await getNosanaClient();
  const markets = await client.jobs.markets();

  if (markets.length === 0) {
    throw new Error('No Nosana markets found. The network may be unavailable.');
  }

  // Filter to markets that have nodes waiting (NODE_QUEUE = 1)
  // JOB_QUEUE (0) means jobs are queued waiting for nodes — avoid those.
  const readyMarkets = markets.filter((m) => m.queueType === 1 && m.queue.length > 0);
  const pool = readyMarkets.length > 0 ? readyMarkets : markets; // fallback to all

  let sorted: Market[];

  switch (strategy) {
    case 'CHEAPEST':
      // Sort by jobPrice ascending — user pays least
      sorted = [...pool].sort((a, b) => a.jobPrice - b.jobPrice);
      break;

    case 'FASTEST':
      // Sort by nodeXnosMinimum descending — higher stake = better hardware
      sorted = [...pool].sort((a, b) => b.nodeXnosMinimum - a.nodeXnosMinimum);
      break;

    case 'BALANCED': {
      // Sort by price-per-stake-unit ascending (low cost, high quality)
      // Guard against division by zero
      const score = (m: Market): number =>
        m.nodeXnosMinimum > 0 ? m.jobPrice / m.nodeXnosMinimum : Infinity;
      sorted = [...pool].sort((a, b) => score(a) - score(b));
      break;
    }

    default:
      throw new Error(`Unknown market strategy: ${strategy as string}`);
  }

  return sorted[0];
}

/**
 * List all available markets (raw).
 */
export async function listMarkets(): Promise<Market[]> {
  const client = await getNosanaClient();
  return client.jobs.markets();
}