import { 
  getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction,
} from '@umbra-privacy/sdk';
import type { Address } from '@solana/kit';
import type { U64 } from '@umbra-privacy/sdk/types';
import type { UmbraClient } from './client.js';

export async function unshieldAsset(
  client: UmbraClient,
  mint: Address,
  amount: U64,
  destination: Address,
) {
  const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });
  return withdraw(destination, mint, amount);
}