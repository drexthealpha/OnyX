export interface ShieldResult {
  utxoId: string;
  txHash: string;
}
export interface SwapResult {
  txHash: string;
  outputUtxoId?: string;
  executionPrice?: number;
  actualSlippageBps?: number;
}
export interface UnshieldResult {
  txHash: string;
}
export async function shield(params: { token: string; amount: number }): Promise<ShieldResult> {
  throw new Error('Privacy execution requires @onyx/privacy module - shield not available via stub');
}
export async function unshield(params: { utxoId: string }): Promise<UnshieldResult> {
  throw new Error('Privacy execution requires @onyx/privacy module - unshield not available via stub');
}
export async function privateSwap(params: {
  fromToken: string;
  toToken: string;
  amount: number;
  slippageBps?: number;
  shieldedUtxo?: string;
}): Promise<SwapResult> {
  throw new Error('Privacy execution requires @onyx/privacy module - privateSwap not available via stub');
}