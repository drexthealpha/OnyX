import {
  getSelfClaimableUtxoToEncryptedBalanceClaimerFunction,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getSelfClaimableUtxoToPublicBalanceClaimerFunction,
} from '@umbra-privacy/sdk';
import type { ClaimResult } from './types.js';
import type { UmbraClient } from './client.js';

type UTXO = { [key: string]: unknown };

export async function claimSelfClaimableToEncryptedBalance(
  client: UmbraClient,
  zkProver: any,
  relayer: any,
  utxos: UTXO[],
): Promise<ClaimResult> {
  const claimer = getSelfClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    { 
      zkProver, 
      relayer,
      fetchBatchMerkleProof: client.fetchBatchMerkleProof.bind(client)
    },
  );
  const result = await claimer(utxos as any);
  return result as unknown as ClaimResult;
}

export async function claimReceiverClaimableToEncryptedBalance(
  client: UmbraClient,
  zkProver: any,
  relayer: any,
  utxos: UTXO[],
): Promise<ClaimResult> {
  const claimer = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    { 
      zkProver, 
      relayer,
      fetchBatchMerkleProof: client.fetchBatchMerkleProof.bind(client)
    },
  );
  const result = await claimer(utxos as any);
  return result as unknown as ClaimResult;
}

export async function claimSelfClaimableToPublicBalance(
  client: UmbraClient,
  zkProver: any,
  relayer: any,
  utxos: UTXO[],
): Promise<ClaimResult> {
  const claimer = getSelfClaimableUtxoToPublicBalanceClaimerFunction(
    { client },
    { 
      zkProver, 
      relayer,
      fetchBatchMerkleProof: client.fetchBatchMerkleProof.bind(client)
    },
  );
  const result = await claimer(utxos as any);
  return result as unknown as ClaimResult;
}