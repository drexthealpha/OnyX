import { getClaimableUtxoScannerFunction } from '@umbra-privacy/sdk';
import type { UTXOScanResult } from './types.js';
import type { UmbraClient } from './client.js';

export async function scanUTXOs(
  client: UmbraClient,
  treeIndex: number,
  startInsertionIndex: number,
): Promise<UTXOScanResult> {
  const scanner = getClaimableUtxoScannerFunction({ client });
  // SDK expects U32 which is represented as bigint in this version
  const result = await scanner(BigInt(treeIndex) as any, BigInt(startInsertionIndex) as any);
  return {
    selfBurnable: result.selfBurnable ?? [],
    received: result.received ?? [],
    publicSelfBurnable: result.publicSelfBurnable ?? [],
    publicReceived: result.publicReceived ?? [],
  };
}