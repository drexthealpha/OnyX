import type { Address, U64, GiftCard, ClaimResult } from './types.js';
import type { UmbraClient } from './client.js';
import { createSelfClaimableUtxoFromPublicBalance } from './utxo-create.js';
import { scanUTXOs } from './utxo-scan.js';
import { claimSelfClaimableToEncryptedBalance } from './utxo-claim.js';
import { getZkProvers } from './zk-prover.js';
import { getUmbraRelayer } from '@umbra-privacy/sdk';

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
  
  const destinationAddress = claimCode as unknown as Address;
  
  const provers = await getZkProvers();
  
  const signatures = await createSelfClaimableUtxoFromPublicBalance(
    client,
    provers.createSelfClaimableUtxoFromPublicBalance,
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

  const provers = await getZkProvers();
  const relayer = getUmbraRelayer({
    apiEndpoint: 'https://relayer.api.umbraprivacy.com',
  });

  return claimSelfClaimableToEncryptedBalance(
    client,
    provers.claimSelfClaimableToEncryptedBalance,
    relayer,
    matchingUtxos as unknown as Array<{ [key: string]: unknown }>,
  );
}