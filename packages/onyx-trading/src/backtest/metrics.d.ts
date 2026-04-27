/**
 * Backtest metrics — Sharpe, Sortino, max drawdown, CAGR, Calmar
 */
export interface BacktestMetrics {
    sharpe: number;
    sortino: number;
    maxDrawdown: number;
    cagr: number;
    calmar: number;
    volatility: number;
    meanReturn: number;
    winRate: number;
}
export declare function computeMetrics(equityCurve: number[], trades: Array<{
    action: string;
    price: number;
}>, periodDays?: number, riskFreeRate?: number): BacktestMetrics;
//# sourceMappingURL=metrics.d.ts.map