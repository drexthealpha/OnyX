import {
  getComplianceGrantIssuerFunction,
  getComplianceGrantRevokerFunction,
  getUserComplianceGrantQuerierFunction,
  getEncryptedBalanceQuerierFunction,
} from '@umbra-privacy/sdk';
import { generateRandomNonce } from '@umbra-privacy/sdk/utils';
import type { Address } from '@solana/kit';
import type { ComplianceReport, U64 } from './types.js';
import type { UmbraClient } from './client.js';

export async function grantViewingAccess(
  client: UmbraClient,
  auditorAddress: Address,
  auditorX25519: Uint8Array,
  nonce: Uint8Array,
): Promise<string> {
  const granterX25519 = (await import('@umbra-privacy/sdk')).getMasterViewingKeyX25519KeypairGenerator;
  const generator = granterX25519({ client });
  const result = await generator();
  
  const createGrant = getComplianceGrantIssuerFunction({ client });
  const signature = await createGrant(
    auditorAddress,
    result.x25519Keypair.publicKey,
    auditorX25519,
    nonce,
  );
  
  return signature;
}

export async function revokeViewingAccess(
  client: UmbraClient,
  auditorAddress: Address,
  granterX25519: Uint8Array,
  nonce: Uint8Array,
): Promise<string> {
  const deleteGrant = getComplianceGrantRevokerFunction({ client });
  const signature = await deleteGrant(
    auditorAddress,
    granterX25519,
    granterX25519,
    nonce,
  );
  
  return signature;
}

export async function generateComplianceReport(
  client: UmbraClient,
  _viewingKey: string,
  startTimestamp: number,
  endTimestamp: number,
): Promise<ComplianceReport> {
  const queryBalances = getEncryptedBalanceQuerierFunction({ client });
  const mints: Address[] = [
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    'So11111111111111111111111111111111111111112',
  ] as Address[];
  
  const balances = await queryBalances(mints);
  
  const inflows: Array<{ mint: string; amount: bigint; timestamp: number; txSignature: string }> = [];
  const outflows: Array<{ mint: string; amount: bigint; timestamp: number; txSignature: string }> = [];
  const netBalances: Record<string, bigint> = {};
  
  for (const [mint, result] of balances) {
    if (result.state === 'shared') {
      netBalances[mint] = result.balance;
    } else {
      netBalances[mint] = 0n;
    }
  }
  
  return {
    address: client.signer.address,
    period: { start: startTimestamp, end: endTimestamp },
    inflows,
    outflows,
    netBalances,
  };
}