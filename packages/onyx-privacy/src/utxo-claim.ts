import {
  getSelfClaimableUtxoToEncryptedBalanceClaimerFunction,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getSelfClaimableUtxoToPublicBalanceClaimerFunction,
  type IUmbraClient,
} from '@umbra-privacy/sdk';
import type { ClaimResult } from './types.js';
import type { UmbraClient } from './client.js';

type ClaimableUtxoData = {
  merkleRoot: Uint8Array;
  merklePath: Uint8Array[];
  leafIndex: bigint;
  amount: bigint;
  destinationAddress: string;
  [key: string]: unknown;
};

export async function claimSelfClaimableToEncryptedBalance(
  client: UmbraClient,
  zkProver: any,
  relayer: any,
  utxos: ClaimableUtxoData[],
): Promise<ClaimResult> {
  const claimer = getSelfClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    { 
      zkProver, 
      relayer,
      fetchBatchMerkleProof: client.fetchBatchMerkleProof?.bind(client)
    },
  );
  const result = await claimer(utxos);
  return {
    requestId: Object.keys(result.signatures)[0] || '0',
    status: 'completed',
    signature: result.signatures[0]?.[0],
    elapsedMs: 0,
  };
}

export async function claimReceiverClaimableToEncryptedBalance(
  client: UmbraClient,
  zkProver: any,
  relayer: any,
  utxos: ClaimableUtxoData[],
): Promise<ClaimResult> {
  const claimer = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    { 
      zkProver, 
      relayer,
      fetchBatchMerkleProof: client.fetchBatchMerkleProof?.bind(client)
    },
  );
  const result = await claimer(utxos);
  return {
    requestId: Object.keys(result.signatures)[0] || '0',
    status: 'completed',
    signature: result.signatures[0]?.[0],
    elapsedMs: 0,
  };
}

export async function claimSelfClaimableToPublicBalance(
  client: UmbraClient,
  zkProver: any,
  relayer: any,
  utxos: ClaimableUtxoData[],
): Promise<ClaimResult> {
  const claimer = getSelfClaimableUtxoToPublicBalanceClaimerFunction(
    { client },
    { 
      zkProver, 
      relayer,
      fetchBatchMerkleProof: client.fetchBatchMerkleProof?.bind(client)
    },
  );
  const result = await claimer(utxos);
  return {
    requestId: Object.keys(result.signatures)[0] || '0',
    status: 'completed',
    signature: result.signatures[0]?.[0],
    elapsedMs: 0,
  };
}