/**
 * Collection: onyx_markets
 * Stores market signals — price events, news, on-chain data, trade alerts.
 *
 * Vector size: 384 (all-MiniLM-L6-v2)
 */
import { type SearchResult } from '../search.js';
export interface MarketSignalPoint {
    id: string;
    text: string;
    payload: {
        timestamp: number;
        symbol: string;
        signalType: string;
        value?: number;
        direction?: 'up' | 'down' | 'neutral';
        confidence?: number;
        source?: string;
        [key: string]: unknown;
    };
}
export interface MarketSignalResult extends SearchResult {
    payload: MarketSignalPoint['payload'];
}
declare function upsert(points: MarketSignalPoint[]): Promise<void>;
declare function searchSignals(query: string, topK?: number): Promise<MarketSignalResult[]>;
declare function deleteSignals(ids: string[]): Promise<void>;
declare function get(id: string): Promise<MarketSignalPoint['payload'] | null>;
export declare const marketSignals: {
    upsert: typeof upsert;
    search: typeof searchSignals;
    delete: typeof deleteSignals;
    get: typeof get;
};
export {};
//# sourceMappingURL=market-signals.d.ts.map