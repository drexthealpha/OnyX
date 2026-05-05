import { getClaimableUtxoScannerFunction } from '@umbra-privacy/sdk';
import type { UTXOScanResult } from './types.js';
import type { UmbraClient } from './client.js';

export async function scanUTXOs(
  client: UmbraClient,
  treeIndex: number,
  startInsertionIndex: number,
  endInsertionIndex?: number,
): Promise<UTXOScanResult> {
  const scanner = getClaimableUtxoScannerFunction({ client });
  const result = await scanner(
    BigInt(treeIndex) as any,
    BigInt(startInsertionIndex) as any,
    endInsertionIndex !== undefined ? BigInt(endInsertionIndex) as any : undefined
  );
  return {
    selfBurnable: result.selfBurnable ?? [],
    received: result.received ?? [],
    publicSelfBurnable: result.publicSelfBurnable ?? [],
    publicReceived: result.publicReceived ?? [],
  };
}