import type { Address, U64, PaymentLink } from './types.js';
import type { UmbraClient } from './client.js';
import { createReceiverClaimableUtxoFromPublicBalance } from './utxo-create.js';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function createPaymentLink(params: Omit<PaymentLink, 'id' | 'url'>): PaymentLink {
  const id = generateUUID();
  const searchParams = new URLSearchParams({
    id,
    mint: params.mint,
    amount: params.amount.toString(),
    to: params.recipientAddress,
  });
  
  if (params.expiresAt) {
    searchParams.set('exp', params.expiresAt.toString());
  }
  if (params.memo) {
    searchParams.set('memo', params.memo);
  }

  const url = `onyx://pay?${searchParams.toString()}`;

  return {
    id,
    url,
    mint: params.mint,
    amount: params.amount,
    recipientAddress: params.recipientAddress,
    expiresAt: params.expiresAt,
    memo: params.memo,
  };
}

export function parsePaymentLink(url: string): Omit<PaymentLink, 'url'> {
  const parsedUrl = new URL(url);
  
  if (parsedUrl.protocol !== 'onyx:' && parsedUrl.hostname !== 'pay') {
    throw new Error('[onyx-privacy] Invalid payment link format');
  }

  const id = parsedUrl.searchParams.get('id');
  const mint = parsedUrl.searchParams.get('mint');
  const amount = parsedUrl.searchParams.get('amount');
  const to = parsedUrl.searchParams.get('to');
  const exp = parsedUrl.searchParams.get('exp');
  const memo = parsedUrl.searchParams.get('memo');

  if (!id || !mint || !amount || !to) {
    throw new Error('[onyx-privacy] Missing required payment link parameters');
  }

  return {
    id,
    mint: mint as Address,
    amount: BigInt(amount) as U64,
    recipientAddress: to as Address,
    expiresAt: exp ? parseInt(exp, 10) : undefined,
    memo: memo ?? undefined,
  };
}

export async function payFromLink(
  client: UmbraClient,
  link: PaymentLink,
): Promise<string[]> {
  if (link.expiresAt && Date.now() > link.expiresAt) {
    throw new Error('[onyx-privacy] Payment link has expired');
  }

  return createReceiverClaimableUtxoFromPublicBalance(
    client,
    null as unknown as unknown,
    {
      destinationAddress: link.recipientAddress,
      mint: link.mint,
      amount: link.amount,
    },
  );
}