/**
 * Trader — executes RiskDecision by routing through @onyx/solana swapTokens
 * and @onyx/privacy for position privacy
 */

import { RiskDecision, ExecutionResult, Portfolio } from './types.js';
import { executePrivate } from './private-execution.js';
import { resolveToken } from './data/tokens.js';
import { fetchPrice } from './data/birdeye.js';
import * as solana from '@onyx/solana';

export interface TraderConfig {
  usePrivacy: boolean;
  maxSlippageBps: number;
}

const DEFAULT_CONFIG: TraderConfig = {
  usePrivacy: false,
  maxSlippageBps: 100,
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



  if (cfg.usePrivacy) {
    try {
      const result = await executePrivate({
        token,
        action: decision.action as 'BUY' | 'SELL',
        amountUsd: tradeValueUsd,
        slippageBps: cfg.maxSlippageBps,
      });
      if (result.success) return result;
      console.warn('[onyx-trading] Private execution failed, falling back to direct Jupiter swap:', result.error);
    } catch (err) {
      console.warn('[onyx-trading] Private execution threw an error, falling back to direct Jupiter swap:', err);
    }
  }

  try {
    const [inputToken, outputToken, currentPrice] = await Promise.all([
      resolveToken(decision.action === 'BUY' ? 'USDC' : token),
      resolveToken(decision.action === 'BUY' ? token : 'USDC'),
      fetchPrice(token),
    ]);

    const amountInSmallestUnit = Math.round(
      (decision.action === 'BUY' 
        ? tradeValueUsd 
        : (tradeValueUsd / currentPrice)) * Math.pow(10, inputToken.decimals)
    );
    const result = await solana.executeTool('swapTokens', {
      inputMint: inputToken.mint,
      outputMint: outputToken.mint,
      amount: amountInSmallestUnit,
      slippageBps: cfg.maxSlippageBps,
    }) as { signature: string; outputAmount?: string; price?: number };

    return {
      success: true,
      txHash: result.signature,
      amountExecuted: tradeValueUsd,
      priceExecuted: currentPrice,
      slippage: result.price ?? 0,
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