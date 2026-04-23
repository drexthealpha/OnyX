import { getPublicBalanceToEncryptedBalanceDirectDepositorFunction } from '@umbra-privacy/sdk';
import type { Address, DepositResult, U64 } from './types.js';
import type { UmbraClient } from './client.js';

export async function shieldAsset(
  client: UmbraClient,
  mint: Address,
  amount: U64,
  destination: Address,
): Promise<DepositResult> {
  const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
  const result = await deposit(destination, mint, amount);
  console.debug('[onyx-privacy] shieldAsset queued:', result.queueSignature);
  console.debug('[onyx-privacy] shieldAsset callback confirmed:', result.callbackSignature);
  return result;
}