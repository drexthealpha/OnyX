import type { PayrollEntry, PayrollResult } from './types.js';
import type { Address } from '@solana/kit';
import type { U64 } from '@umbra-privacy/sdk/types';
import type { UmbraClient } from './client.js';
import { createReceiverClaimableUtxoFromPublicBalance } from './utxo-create.js';
import { getZkProvers } from './zk-prover.js';

export async function runPayroll(
  client: UmbraClient,
  entries: PayrollEntry[],
): Promise<PayrollResult[]> {
  const results: PayrollResult[] = [];
  const provers = await getZkProvers();

  for (const entry of entries) {
    try {
      const signatures = await createReceiverClaimableUtxoFromPublicBalance(
        client,
        provers.createReceiverClaimableUtxoFromPublicBalance,
        {
          destinationAddress: entry.recipientAddress as unknown as Address,
          mint: entry.mint as unknown as Address,
          amount: entry.amount as unknown as U64,
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