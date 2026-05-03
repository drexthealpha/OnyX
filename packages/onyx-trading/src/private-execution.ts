/**
 * Private execution — routes all trades through @onyx/privacy (Umbra)
 * Operator cost: $0 — user provides their Umbra setup
 */

import { ExecutionResult } from './types.js';
import fs from 'fs';
import { Keypair } from '@solana/web3.js';
import * as privacy from '@onyx/privacy';
import { resolveToken } from './data/tokens.js';
import { fetchPrice } from './data/birdeye.js';

export interface PrivateTradeParams {
  token: string;
  action: 'BUY' | 'SELL';
  amountUsd: number;
  slippageBps?: number;
}

export async function executePrivate(params: PrivateTradeParams): Promise<ExecutionResult> {
  const { token, action, amountUsd, slippageBps = 100 } = params;

  try {
    const walletPath = process.env['ONYX_WALLET_PATH'];
    if (!walletPath) {
      throw new Error(
        'ONYX_WALLET_PATH env var not set — set it to the path of your Solana keypair JSON file',
      );
    }

    const secret = Uint8Array.from(
      JSON.parse(fs.readFileSync(walletPath, 'utf8')) as number[],
    );
    const signer = Keypair.fromSecretKey(secret);

    const client = await privacy.createUmbraClient({ signer });

    const [tokenInfo, usdcInfo, tokenPrice] = await Promise.all([
      resolveToken(token),
      resolveToken('USDC'),
      fetchPrice(token),
    ]);

    if (action === 'BUY') {
      const shieldResult = await privacy.shieldAsset(
        client,
        privacy.createAddress(usdcInfo.mint),
        privacy.createU64(BigInt(Math.round(amountUsd * Math.pow(10, usdcInfo.decimals)))),
        privacy.createAddress(tokenInfo.mint),
      );

      return {
        success: true,
        txHash: shieldResult.queueSignature,
        amountExecuted: amountUsd,
        priceExecuted: tokenPrice,
        slippage: slippageBps,
        timestamp: Date.now(),
      };
    } else {
      const amountToUnshield = (amountUsd / tokenPrice) * Math.pow(10, tokenInfo.decimals);
      const unshieldResult = await privacy.unshieldAsset(
        client,
        privacy.createAddress(tokenInfo.mint),
        privacy.createU64(BigInt(Math.round(amountToUnshield))),
        privacy.createAddress(usdcInfo.mint),
      );

      return {
        success: true,
        txHash: unshieldResult.queueSignature,
        amountExecuted: amountUsd,
        priceExecuted: tokenPrice,
        slippage: slippageBps,
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