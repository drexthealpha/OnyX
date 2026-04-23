import type { Address, U64, PayrollEntry, PayrollResult } from './types.js';
import type { UmbraClient } from './client.js';
import { createReceiverClaimableUtxoFromPublicBalance } from './utxo-create.js';

export async function runPayroll(
  client: UmbraClient,
  entries: PayrollEntry[],
): Promise<PayrollResult[]> {
  const results: PayrollResult[] = [];

  for (const entry of entries) {
    try {
      const signatures = await createReceiverClaimableUtxoFromPublicBalance(
        client,
        null as unknown as unknown,
        {
          destinationAddress: entry.recipientAddress,
          mint: entry.mint,
          amount: entry.amount,
        },
      );

      results.push({
        recipientAddress: entry.recipientAddress,
        amount: entry.amount,
        utxoSignatures: signatures,
        status: 'sent',
      });
    } catch (err) {
      results.push({
        recipientAddress: entry.recipientAddress,
        amount: entry.amount,
        utxoSignatures: [],
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}