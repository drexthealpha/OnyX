/**
 * Birdeye OHLCV + market data
 * API key: user's BIRDEYE_API_KEY env var (operator cost $0)
 * Docs: https://docs.birdeye.so/reference/get_defi-ohlcv
 */
import { OHLCV } from '../types.js';
export interface BirdeyeOHLCVParams {
    address: string;
    type: '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '6H' | '8H' | '12H' | '1D' | '3D' | '1W' | '1M';
    timeFrom?: number;
    timeTo?: number;
    limit?: number;
}
export declare function fetchOHLCV(params: BirdeyeOHLCVParams): Promise<OHLCV[]>;
export declare function fetchPrice(address: string): Promise<number>;
export interface TokenOverview {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    liquidity: number;
    holders: number;
}
export declare function fetchTokenOverview(address: string): Promise<TokenOverview>;
//# sourceMappingURL=birdeye.d.ts.map