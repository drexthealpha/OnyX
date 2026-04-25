/**
 * Trader — executes RiskDecision by routing through @onyx/solana swapTokens
 * and @onyx/privacy for position privacy
 */

import { RiskDecision, ExecutionResult, Portfolio } from './types.js';
import { executePrivate } from './private-execution.js';

export interface TraderConfig {
  usePrivacy: boolean;
  maxSlippageBps: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: TraderConfig = {
  usePrivacy: true,
  maxSlippageBps: 100,
  dryRun: false,
};

export async function execute(
  token: string,
  decision: RiskDecision,
  portfolio: Portfolio,
  config: Partial<TraderConfig> = {},
): Promise<ExecutionResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (decision.action === 'HOLD') {
    return {
      success: true,
      amountExecuted: 0,
      priceExecuted: 0,
      slippage: 0,
      timestamp: Date.now(),
    };
  }

  const tradeValueUsd = portfolio.totalValueUsd * decision.size;

  if (tradeValueUsd < 1) {
    return {
      success: false,
      amountExecuted: 0,
      priceExecuted: 0,
      slippage: 0,
      error: `Trade size too small: $${tradeValueUsd.toFixed(4)}`,
      timestamp: Date.now(),
    };
  }

  if (cfg.dryRun) {
    return {
      success: true,
      txHash: `dry-run-${Date.now()}`,
      amountExecuted: tradeValueUsd,
      priceExecuted: 0,
      slippage: 0,
      timestamp: Date.now(),
    };
  }

  if (cfg.usePrivacy) {
    return executePrivate({
      token,
      action: decision.action as 'BUY' | 'SELL',
      amountUsd: tradeValueUsd,
      slippageBps: cfg.maxSlippageBps,
    });
  }

  try {
    const solana = await import('@onyx/solana');
    const result = await solana.executeTool('swapTokens', {
      fromToken: decision.action === 'BUY' ? 'USDC' : token,
      toToken: decision.action === 'BUY' ? token : 'USDC',
      amountUsd: tradeValueUsd,
      slippageBps: cfg.maxSlippageBps,
    }) as { txHash: string; executionPrice?: number; actualSlippageBps?: number };

    return {
      success: true,
      txHash: result.txHash,
      amountExecuted: tradeValueUsd,
      priceExecuted: result.executionPrice ?? 0,
      slippage: result.actualSlippageBps ?? 0,
      timestamp: Date.now(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      amountExecuted: 0,
      priceExecuted: 0,
      slippage: 0,
      error: `Direct execution failed: ${msg}`,
      timestamp: Date.now(),
    };
  }
}