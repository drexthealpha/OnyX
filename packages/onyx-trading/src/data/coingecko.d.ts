/**
 * CoinGecko global market data — free public API (no key needed)
 * Rate limit: 10-30 calls/min on free tier
 * Docs: https://docs.coingecko.com/reference/introduction
 */
export interface GlobalMarketData {
    totalMarketCapUsd: number;
    totalVolumeUsd: number;
    btcDominance: number;
    ethDominance: number;
    marketCapChangePercent24h: number;
    activeCryptocurrencies: number;
    fearGreedIndex?: number;
}
export declare function fetchGlobalMarketData(): Promise<GlobalMarketData>;
export interface CoinPrice {
    id: string;
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
}
export declare function fetchCoinPrice(coinIds: string[]): Promise<CoinPrice[]>;
export declare function fetchTrendingCoins(): Promise<Array<{
    id: string;
    name: string;
    symbol: string;
    rank: number;
}>>;
//# sourceMappingURL=coingecko.d.ts.map