import { type Market } from '@nosana/kit';
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
export declare function selectMarket(strategy: MarketStrategy): Promise<Market>;
/**
 * List all available markets (raw).
 */
export declare function listMarkets(): Promise<Market[]>;
//# sourceMappingURL=markets.d.ts.map