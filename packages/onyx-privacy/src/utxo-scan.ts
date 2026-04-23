import { getClaimableUtxoScannerFunction } from '@umbra-privacy/sdk';
import type { UTXOScanResult } from './types.js';
import type { UmbraClient } from './client.js';

export async function scanUTXOs(
  client: UmbraClient,
  treeIndex: number,
  startInsertionIndex: number,
): Promise<UTXOScanResult> {
  const scanner = getClaimableUtxoScannerFunction({ client });
  const result = await scanner(treeIndex, startInsertionIndex);
  return {
    selfBurnable: result.selfBurnable ?? [],
    received: result.received ?? [],
    publicSelfBurnable: result.publicSelfBurnable ?? [],
    publicReceived: result.publicReceived ?? [],
  };
}