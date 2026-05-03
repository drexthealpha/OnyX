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
  zkProver: unknown,
  params: UTXOCreateParams,
): Promise<any> {
  const creator = getEncryptedBalanceToSelfClaimableUtxoCreatorFunction({ client }, { zkProver: zkProver as any });
  return creator({
    destinationAddress: params.destinationAddress as any,
    mint: params.mint as any,
    amount: params.amount as any,
  });
}

export async function createReceiverClaimableUtxoFromEncryptedBalance(
  client: UmbraClient,
  zkProver: unknown,
  params: UTXOCreateParams,
): Promise<any> {
  const creator = getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction({ client }, { zkProver: zkProver as any });
  return creator({
    destinationAddress: params.destinationAddress as any,
    mint: params.mint as any,
    amount: params.amount as any,
  });
}

export async function createSelfClaimableUtxoFromPublicBalance(
  client: UmbraClient,
  zkProver: unknown,
  params: UTXOCreateParams,
): Promise<any> {
  const creator = getPublicBalanceToSelfClaimableUtxoCreatorFunction({ client }, { zkProver: zkProver as any });
  return creator({
    destinationAddress: params.destinationAddress as any,
    mint: params.mint as any,
    amount: params.amount as any,
  });
}

export async function createReceiverClaimableUtxoFromPublicBalance(
  client: UmbraClient,
  zkProver: unknown,
  params: UTXOCreateParams,
): Promise<any> {
  const creator = getPublicBalanceToReceiverClaimableUtxoCreatorFunction({ client }, { zkProver: zkProver as any });
  return creator({
    destinationAddress: params.destinationAddress as any,
    mint: params.mint as any,
    amount: params.amount as any,
  });
}