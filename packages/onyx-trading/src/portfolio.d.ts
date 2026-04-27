/**
 * Portfolio state tracking
 * In-memory store — production would use a DB
 */
import { Portfolio, CompletedTrade } from './types.js';
export declare function getPortfolio(): Portfolio;
export declare function setStartingCapital(usd: number): void;
export declare function recordBuy(token: string, amountUsd: number, price: number): void;
export declare function recordSell(token: string, amountUsd: number, price: number): void;
export declare function updatePositionPrice(token: string, price: number): void;
export declare function addTrade(trade: CompletedTrade): void;
export declare function getTradeHistory(): CompletedTrade[];
export declare function getLastNTrades(n: number): CompletedTrade[];
//# sourceMappingURL=portfolio.d.ts.map