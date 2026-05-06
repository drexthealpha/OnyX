import {
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
  getUserRegistrationFunction,
  getUserAccountQuerierFunction,
} from '@umbra-privacy/sdk';
import type { Address } from '@solana/kit';
import type { U64, UmbraClient } from '@umbra-privacy/sdk';

async function ensureRegistered(client: UmbraClient): Promise<void> {
  const query = getUserAccountQuerierFunction({ client });
  const result = await query((client as any).signer.address);
  if (result.state !== 'exists' || !result.data.isUserAccountX25519KeyRegistered) {
    const register = getUserRegistrationFunction({ client });
    await register({ confidential: true, anonymous: true });
  }
}

export async function shieldAsset(
  client: UmbraClient,
  mint: Address,
  amount: U64,
  destination: Address,
  forDemo = false,
) {
  await ensureRegistered(client);
  const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
  return deposit(destination, mint, amount, { awaitCallback: !forDemo });
}