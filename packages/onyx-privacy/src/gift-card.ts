import type { Address, U64, GiftCard, ClaimResult } from './types.js';
import type { UmbraClient } from './client.js';
import { createSelfClaimableUtxoFromPublicBalance } from './utxo-create.js';
import { scanUTXOs } from './utxo-scan.js';
import { claimSelfClaimableToEncryptedBalance } from './utxo-claim.js';

function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function issueGiftCard(
  client: UmbraClient,
  mint: Address,
  amount: U64,
): Promise<GiftCard> {
  const id = crypto.randomUUID ? crypto.randomUUID() : 'gift-' + Date.now();
  
  const claimSecret = generateRandomBytes(32);
  const claimCode = bytesToHex(claimSecret);
  
  const destinationAddress = claimCode as Address;
  
  const signatures = await createSelfClaimableUtxoFromPublicBalance(
    client,
    null as unknown as unknown,
    {
      destinationAddress,
      mint,
      amount,
    },
  );

  return {
    id,
    mint,
    amount,
    claimCode,
    utxoSignatures: signatures,
  };
}

export async function claimGiftCard(
  client: UmbraClient,
  claimCode: string,
): Promise<ClaimResult> {
  const scanned = await scanUTXOs(client, 0, 0);
  
  const matchingUtxos = scanned.selfBurnable.filter(
    (utxo: unknown) => (utxo as { destination?: string })?.destination === claimCode
  );

  if (matchingUtxos.length === 0) {
    return {
      requestId: 'no_utxo_found',
      status: 'failed',
      elapsedMs: 0,
    };
  }

  return claimSelfClaimableToEncryptedBalance(
    client,
    null as unknown as unknown,
    null as unknown as unknown,
    matchingUtxos as unknown as Array<{ [key: string]: unknown }>,
  );
}