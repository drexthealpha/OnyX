import type { Address, U64, UmbraNetwork, X402PrivatePaymentParams, X402PaymentResult, X402PaymentVerification } from './types.js';
import type { UmbraClient } from './client.js';
import { createReceiverClaimableUtxoFromPublicBalance } from './utxo-create.js';

export async function createPrivateX402Payment(
  params: X402PrivatePaymentParams,
): Promise<X402PaymentResult> {
  const client = params.client as UmbraClient;
  
  const signatures = await createReceiverClaimableUtxoFromPublicBalance(
    client,
    null as unknown as unknown,
    {
      destinationAddress: params.recipientAddress,
      mint: params.mint,
      amount: params.amount,
    },
  );

  const paymentToken = Buffer.from(JSON.stringify({
    reference: params.paymentReference,
    amount: params.amount.toString(),
    mint: params.mint,
    signatures,
    timestamp: Date.now(),
  })).toString('base64');

  return {
    signature: signatures[0] ?? 'mock_signature',
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