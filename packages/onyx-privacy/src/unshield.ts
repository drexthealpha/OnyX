import { getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction } from '@umbra-privacy/sdk';
import type { Address, WithdrawResult, U64 } from './types.js';
import type { UmbraClient } from './client.js';

export async function unshieldAsset(
  client: UmbraClient,
  mint: Address,
  amount: U64,
  destination: Address,
): Promise<WithdrawResult> {
  const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });
  const result = await withdraw(destination, mint, amount);
  return result;
}