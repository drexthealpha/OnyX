/**
 * @onyx/trading — barrel export
 * Multi-agent trading system with bull/bear debate and Kelly sizing
 */

// Orchestrator
export { runAnalysis } from './orchestrator.js';
export type { OrchestratorConfig, RiskProfile } from './orchestrator.js';

// Types
export type {
  OHLCV,
  MarketAnalysis,
  NewsAnalysis,
  FundamentalAnalysis,
  SocialAnalysis,
  ResearchReport,
  RiskDecision,
  TradeDecision,
  Portfolio,
  ExecutionResult,
  CompletedTrade,
  TradeSignal,
  BacktestResult,
} from './types.js';

// Analysts
export { analyze as analyzeMarket } from './analysts/market.js';
export { analyzeNews } from './analysts/news.js';
export { analyzeFundamentals } from './analysts/fundamental.js';
export { analyzeSocial } from './analysts/social.js';

// Researchers
export * as bullResearcher from './researchers/bull.js';
export * as bearResearcher from './researchers/bear.js';

// Risk
export { adjudicate } from './risk/manager.js';
export { adjudicateAggressive } from './risk/aggressive.js';
export { adjudicateConservative } from './risk/conservative.js';
export { adjudicateNeutral } from './risk/neutral.js';

// Portfolio
export {
  getPortfolio,
  setStartingCapital,
  recordBuy,
  recordSell,
  updatePositionPrice,
  addTrade,
  getTradeHistory,
  getLastNTrades,
} from './portfolio.js';

// Trader + execution
export { execute } from './trader.js';
export { executePrivate } from './private-execution.js';
export type { TraderConfig } from './trader.js';
export type { PrivateTradeParams } from './private-execution.js';

// RL reporter
export { reportTrade } from './rl-reporter.js';

// Backtest
export { run as runBacktest } from './backtest/engine.js';
export { computeMetrics } from './backtest/metrics.js';
export { formatReport } from './backtest/report.js';
export type { BacktestConfig, BacktestTrade } from './backtest/engine.js';
export type { BacktestMetrics } from './backtest/metrics.js';

// Data sources
export { fetchOHLCV, fetchPrice, fetchTokenOverview } from './data/birdeye.js';
export { fetchTokenMetadata, fetchTransactionStats } from './data/helius.js';
export { fetchGlobalMarketData, fetchCoinPrice, fetchTrendingCoins } from './data/coingecko.js';