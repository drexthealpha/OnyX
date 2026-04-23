import type { Address, U64, Invoice, PaymentLink } from './types.js';
import type { UmbraClient } from './client.js';
import { createPaymentLink, payFromLink } from './payment-link.js';

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

export function createInvoice(params: Omit<Invoice, 'id' | 'status' | 'paymentLink'>): Invoice {
  const id = generateUUID();
  
  let totalAmount = 0n;
  for (const item of params.items) {
    totalAmount += item.amount;
  }
  
  const paymentLink = createPaymentLink({
    mint: params.mint,
    amount: totalAmount as U64,
    recipientAddress: params.issuer,
  });

  return {
    id,
    issuer: params.issuer,
    recipient: params.recipient,
    items: params.items,
    total: totalAmount as U64,
    mint: params.mint,
    dueAt: params.dueAt,
    status: 'pending',
    paymentLink: paymentLink.url,
  };
}

export async function payInvoice(
  client: UmbraClient,
  invoice: Invoice,
): Promise<string[]> {
  if (invoice.status === 'paid') {
    throw new Error('[onyx-privacy] Invoice is already paid');
  }

  if (invoice.paymentLink) {
    const parsed = parsePaymentLink(invoice.paymentLink);
    return payFromLink(client, {
      id: parsed.id,
      url: invoice.paymentLink,
      mint: parsed.mint,
      amount: parsed.amount,
      recipientAddress: parsed.recipientAddress,
      expiresAt: parsed.expiresAt,
      memo: parsed.memo,
    });
  }

  throw new Error('[onyx-privacy] Invoice has no payment link');
}

function parsePaymentLink(url: string): Omit<PaymentLink, 'url'> {
  const parsedUrl = new URL(url);
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

export function markInvoicePaid(invoice: Invoice, signatures: string[]): Invoice {
  return {
    ...invoice,
    status: 'paid',
    paymentLink: undefined,
  };
}