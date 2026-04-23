import {
  getSelfClaimableUtxoToEncryptedBalanceClaimerFunction,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getSelfClaimableUtxoToPublicBalanceClaimerFunction,
} from '@umbra-privacy/sdk';
import type { ClaimResult, UTXOScanResult } from './types.js';
import type { UmbraClient } from './client.js';

type UTXO = { [key: string]: unknown };

export async function claimSelfClaimableToEncryptedBalance(
  client: UmbraClient,
  zkProver: unknown,
  relayer: unknown,
  utxos: UTXO[],
): Promise<ClaimResult> {
  const claimer = getSelfClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    { zkProver, relayer },
  );
  return claimer(utxos) as Promise<ClaimResult>;
}

export async function claimReceiverClaimableToEncryptedBalance(
  client: UmbraClient,
  zkProver: unknown,
  relayer: unknown,
  utxos: UTXO[],
): Promise<ClaimResult> {
  const claimer = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    { zkProver, relayer },
  );
  return claimer(utxos) as Promise<ClaimResult>;
}

export async function claimSelfClaimableToPublicBalance(
  client: UmbraClient,
  zkProver: unknown,
  relayer: unknown,
  utxos: UTXO[],
): Promise<ClaimResult> {
  const claimer = getSelfClaimableUtxoToPublicBalanceClaimerFunction(
    { client },
    { zkProver, relayer },
  );
  return claimer(utxos) as Promise<ClaimResult>;
}