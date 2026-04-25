export interface OHLCV {
  timestamp: number; // Unix ms
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
  confidence: number; // 0–1
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
  score: number; // -1 to 1
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
  sentimentScore: number; // -1 to 1
  trendingScore: number; // 0–1
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: number;
}

export interface ResearchReport {
  thesis: string;
  supportingPoints: string[];
  risks: string[];
  confidence: number; // 0–1
  stance: 'BULL' | 'BEAR';
}

export interface RiskDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  size: number; // fraction of portfolio 0–0.25
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
  positions: Record<string, { amount: number; valueUsd: number; entryPrice: number }>;
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
  size: number; // 0–1 fraction of equity
}

export interface BacktestResult {
  startEquity: number;
  endEquity: number;
  totalReturn: number; // decimal e.g. 0.15 = 15%
  sharpe: number;
  sortino: number;
  maxDrawdown: number; // decimal e.g. -0.12 = -12%
  totalTrades: number;
  winRate: number;
  equityCurve: number[];
  trades: Array<{ index: number; action: string; price: number; equity: number }>;
}