import {
  getEncryptedBalanceToSelfClaimableUtxoCreatorFunction,
  getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction,
  getPublicBalanceToSelfClaimableUtxoCreatorFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
} from '@umbra-privacy/sdk';
import type { Address, U64 } from './types.js';
import type { UmbraClient } from './client.js';

export interface UTXOCreateParams {
  destinationAddress: Address;
  mint: Address;
  amount: U64;
}

export async function createSelfClaimableUtxoFromEncryptedBalance(
  client: UmbraClient,
  zkProver: any,
  params: UTXOCreateParams,
): Promise<string[]> {
  const creator = getEncryptedBalanceToSelfClaimableUtxoCreatorFunction({ client }, { zkProver });
  return creator({
    destinationAddress: params.destinationAddress as any,
    mint: params.mint as any,
    amount: params.amount as any,
  });
}

export async function createReceiverClaimableUtxoFromEncryptedBalance(
  client: UmbraClient,
  zkProver: any,
  params: UTXOCreateParams,
): Promise<string[]> {
  const creator = getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction({ client }, { zkProver });
  return creator({
    destinationAddress: params.destinationAddress as any,
    mint: params.mint as any,
    amount: params.amount as any,
  });
}

export async function createSelfClaimableUtxoFromPublicBalance(
  client: UmbraClient,
  zkProver: any,
  params: UTXOCreateParams,
): Promise<string[]> {
  const creator = getPublicBalanceToSelfClaimableUtxoCreatorFunction({ client }, { zkProver });
  return creator({
    destinationAddress: params.destinationAddress as any,
    mint: params.mint as any,
    amount: params.amount as any,
  });
}

export async function createReceiverClaimableUtxoFromPublicBalance(
  client: UmbraClient,
  zkProver: any,
  params: UTXOCreateParams,
): Promise<string[]> {
  const creator = getPublicBalanceToReceiverClaimableUtxoCreatorFunction({ client }, { zkProver });
  return creator({
    destinationAddress: params.destinationAddress as any,
    mint: params.mint as any,
    amount: params.amount as any,
  });
}