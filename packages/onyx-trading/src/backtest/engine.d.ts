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
export interface BacktestTrade {
    index: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    price: number;
    equity: number;
    size: number;
}
export declare function run(strategyFn: (candle: OHLCV, index: number, history: OHLCV[]) => TradeSignal, candles: OHLCV[], config?: Partial<BacktestConfig>): Promise<BacktestResult>;
//# sourceMappingURL=engine.d.ts.map