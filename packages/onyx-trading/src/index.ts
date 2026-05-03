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
  Position,
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
import {
  getPortfolio,
  setStartingCapital,
  recordBuy,
  recordSell,
  updatePositionPrice,
  addTrade,
  getTradeHistory,
  getLastNTrades,
} from './portfolio.js';

export {
  getPortfolio,
  setStartingCapital,
  recordBuy,
  recordSell,
  updatePositionPrice,
  addTrade,
  getTradeHistory,
  getLastNTrades,
};

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
export { resolveToken, reverseResolveToken } from './data/tokens.js';
export { fetchTokenMetadata, fetchTransactionStats } from './data/helius.js';
export { fetchGlobalMarketData, fetchCoinPrice, fetchTrendingCoins } from './data/coingecko.js';

/**
 * Trading Management API (Library Mode)
 */

export async function getStats() {
  const portfolio = getPortfolio();
  const history = getTradeHistory();
  const now = Date.now();
  const closedTrades = history.filter((t) => t.pnlPct !== undefined);
  const winningTrades = closedTrades.filter((t) => t.pnlPct! > 0);
  const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;

  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const recentTrades = history.filter((t) => t.timestamp >= oneDayAgo);
  const pnl24h = recentTrades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0);

  return {
    portfolioValue: portfolio.totalValueUsd,
    totalTrades: history.length,
    winRate,
    pnl24h,
    timestamp: now,
  };
}

export async function executeTrade(params: any) {
  const { execute } = await import("./trader.js");
  return execute(params.token, params.decision, params.portfolio, params.config);
}

export async function getPositions() {
  const portfolio = getPortfolio();
  return portfolio.positions;
}

import { Connection, Keypair } from '@solana/web3.js';
import fs from 'fs';

export async function validateEnvironment() {
  const walletPath = process.env['ONYX_WALLET_PATH'];
  if (!walletPath) throw new Error('ONYX_WALLET_PATH is required for real-world trading.');
  if (!fs.existsSync(walletPath)) throw new Error(`Wallet not found at ${walletPath}`);
  
  const secret = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')));
  const keypair = Keypair.fromSecretKey(secret);
  
  const rpcUrl = process.env['NOSANA_RPC_URL'] || 'https://api.mainnet-beta.solana.com';
  const conn = new Connection(rpcUrl, 'confirmed');
  
  const balance = await conn.getBalance(keypair.publicKey);
  const SOL = 1e9;
  if (balance < 0.05 * SOL) {
    throw new Error(`Insufficient SOL for trading operations. Found ${balance/SOL} SOL, need at least 0.05 SOL.`);
  }

  if (!process.env['BIRDEYE_API_KEY']) throw new Error('BIRDEYE_API_KEY is missing. Real-world data requires this key.');
  if (!process.env['HELIUS_API_KEY']) throw new Error('HELIUS_API_KEY is missing. Real-world data requires this key.');

  console.log(`[onyx-trading] Environment verified successfully. Using pubkey: ${keypair.publicKey.toBase58()} with balance: ${balance/SOL} SOL.`);
}