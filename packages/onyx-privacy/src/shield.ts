import { 
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
} from '@umbra-privacy/sdk';
import type { Address } from '@solana/kit';
import type { U64 } from '@umbra-privacy/sdk/types';
import type { UmbraClient } from './client.js';

export async function shieldAsset(
  client: UmbraClient,
  mint: Address,
  amount: U64,
  destination: Address,
) {
  const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
  return deposit(destination, mint, amount);
}