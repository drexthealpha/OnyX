/**
 * Private execution — routes all trades through @onyx/privacy (Umbra)
 * Operator cost: $0 — user provides their Umbra setup
 */

import { ExecutionResult } from './types.js';

export interface PrivateTradeParams {
  token: string;
  action: 'BUY' | 'SELL';
  amountUsd: number;
  slippageBps?: number;
}

export async function executePrivate(params: PrivateTradeParams): Promise<ExecutionResult> {
  const { token, action, amountUsd, slippageBps = 100 } = params;

  try {
    const privacy = await import('@onyx/privacy');

    if (action === 'BUY') {
      const shieldResult = await privacy.shield({
        token: 'USDC',
        amount: amountUsd,
      });

      const swapResult = await privacy.privateSwap({
        fromToken: 'USDC',
        toToken: token,
        amount: amountUsd,
        slippageBps,
        shieldedUtxo: shieldResult.utxoId,
      });

      return {
        success: true,
        txHash: swapResult.txHash,
        amountExecuted: amountUsd,
        priceExecuted: swapResult.executionPrice ?? 0,
        slippage: swapResult.actualSlippageBps ?? 0,
        timestamp: Date.now(),
      };
    } else {
      const swapResult = await privacy.privateSwap({
        fromToken: token,
        toToken: 'USDC',
        amount: amountUsd,
        slippageBps,
      });

      const unshieldResult = await privacy.unshield({
        utxoId: swapResult.outputUtxoId ?? '',
      });

      return {
        success: true,
        txHash: unshieldResult.txHash,
        amountExecuted: amountUsd,
        priceExecuted: swapResult.executionPrice ?? 0,
        slippage: swapResult.actualSlippageBps ?? 0,
        timestamp: Date.now(),
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      amountExecuted: 0,
      priceExecuted: 0,
      slippage: 0,
      error: `Private execution failed: ${msg}`,
      timestamp: Date.now(),
    };
  }
}