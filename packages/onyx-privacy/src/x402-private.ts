import type { X402PrivatePaymentParams, X402PaymentResult, X402PaymentVerification } from './types.js';
import type { Address } from '@solana/kit';
import type { U64 } from '@umbra-privacy/sdk/types';
import type { UmbraClient } from './client.js';
import { createReceiverClaimableUtxoFromPublicBalance } from './utxo-create.js';
import { getZkProvers } from './zk-prover.js';

export async function createPrivateX402Payment(
  params: X402PrivatePaymentParams,
): Promise<X402PaymentResult> {
  const client = params.client as UmbraClient;
  const provers = await getZkProvers();

  const signatures = await createReceiverClaimableUtxoFromPublicBalance(
    client,
    provers.createReceiverClaimableUtxoFromPublicBalance,
    {
      destinationAddress: params.recipientAddress as unknown as Address,
      mint: params.mint as unknown as Address,
      amount: params.amount as unknown as U64,
    },
  );

  if (signatures.length === 0) {
    throw new Error('[onyx-privacy] X402 payment failed: no signatures returned');
  }

  const paymentToken = Buffer.from(JSON.stringify({
    reference: params.paymentReference,
    amount: params.amount.toString(),
    mint: params.mint,
    signatures,
    timestamp: Date.now(),
  })).toString('base64');

  return {
    signature: signatures[0],
    paymentToken,
  };
}

export async function processPrivateX402Payment(
  params: { paymentToken: string },
): Promise<X402PaymentVerification> {
  try {
    const decoded = JSON.parse(Buffer.from(params.paymentToken, 'base64').toString('utf-8'));
    
    return {
      verified: true,
      amount: BigInt(decoded.amount),
      mint: decoded.mint,
    };
  } catch {
    return {
      verified: false,
      amount: 0n,
      mint: '',
    };
  }
}