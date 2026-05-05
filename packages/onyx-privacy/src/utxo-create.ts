import {
  getEncryptedBalanceToSelfClaimableUtxoCreatorFunction,
  getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction,
  getPublicBalanceToSelfClaimableUtxoCreatorFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
} from '@umbra-privacy/sdk';
import type { Address, U64 } from '@solana/kit';
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
) {
  const creator = getEncryptedBalanceToSelfClaimableUtxoCreatorFunction({ client }, { zkProver });
  return creator({
    destinationAddress: params.destinationAddress,
    mint: params.mint,
    amount: params.amount,
  });
}

export async function createReceiverClaimableUtxoFromEncryptedBalance(
  client: UmbraClient,
  zkProver: any,
  params: UTXOCreateParams,
) {
  const creator = getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction({ client }, { zkProver });
  return creator({
    destinationAddress: params.destinationAddress,
    mint: params.mint,
    amount: params.amount,
  });
}

export async function createSelfClaimableUtxoFromPublicBalance(
  client: UmbraClient,
  zkProver: any,
  params: UTXOCreateParams,
) {
  const creator = getPublicBalanceToSelfClaimableUtxoCreatorFunction({ client }, { zkProver });
  return creator({
    destinationAddress: params.destinationAddress,
    mint: params.mint,
    amount: params.amount,
  });
}

export async function createReceiverClaimableUtxoFromPublicBalance(
  client: UmbraClient,
  zkProver: any,
  params: UTXOCreateParams,
) {
  const creator = getPublicBalanceToReceiverClaimableUtxoCreatorFunction({ client }, { zkProver });
  return creator({
    destinationAddress: params.destinationAddress,
    mint: params.mint,
    amount: params.amount,
  });
}