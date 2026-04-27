export interface OHLCV {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface MarketAnalysis {
    token: string;
    price: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    indicators: {
        sma20: number;
        ema9: number;
        rsi14: number;
        macd: number;
        macdSignal: number;
        macdHistogram: number;
        bbUpper: number;
        bbMiddle: number;
        bbLower: number;
        [key: string]: number;
    };
    candles: OHLCV[];
    timestamp: number;
}
export interface NewsAnalysis {
    token: string;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number;
    headlines: string[];
    summary: string;
    timestamp: number;
}
export interface FundamentalAnalysis {
    token: string;
    mintAddress: string;
    holders: number;
    transactions24h: number;
    volume24h: number;
    marketCap: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    timestamp: number;
}
export interface SocialAnalysis {
    token: string;
    mentionCount: number;
    sentimentScore: number;
    trendingScore: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    timestamp: number;
}
export interface ResearchReport {
    thesis: string;
    supportingPoints: string[];
    risks: string[];
    confidence: number;
    stance: 'BULL' | 'BEAR';
}
export interface RiskDecision {
    action: 'BUY' | 'SELL' | 'HOLD';
    size: number;
    confidence: number;
    reasoning: string;
    kellyFraction: number;
}
export interface TradeDecision {
    token: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    size: number;
    confidence: number;
    reasoning: string;
    marketAnalysis: MarketAnalysis;
    bullReport: ResearchReport;
    bearReport: ResearchReport;
    riskDecision: RiskDecision;
    timestamp: number;
}
export interface Portfolio {
    totalValueUsd: number;
    positions: Record<string, {
        amount: number;
        valueUsd: number;
        entryPrice: number;
    }>;
    cashUsd: number;
    timestamp: number;
}
export interface ExecutionResult {
    success: boolean;
    txHash?: string;
    amountExecuted: number;
    priceExecuted: number;
    slippage: number;
    error?: string;
    timestamp: number;
}
export interface CompletedTrade {
    token: string;
    action: 'BUY' | 'SELL';
    size: number;
    entryPrice: number;
    exitPrice?: number;
    pnlUsd?: number;
    pnlPct?: number;
    txHash: string;
    timestamp: number;
}
export interface TradeSignal {
    action: 'BUY' | 'SELL' | 'HOLD';
    size: number;
}
export interface BacktestResult {
    startEquity: number;
    endEquity: number;
    totalReturn: number;
    sharpe: number;
    sortino: number;
    maxDrawdown: number;
    totalTrades: number;
    winRate: number;
    equityCurve: number[];
    trades: Array<{
        index: number;
        action: string;
        price: number;
        equity: number;
    }>;
}
//# sourceMappingURL=types.d.ts.map