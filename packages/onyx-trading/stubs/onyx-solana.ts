export interface SwapTokensParams {
  fromToken: string;
  toToken: string;
  amountUsd: number;
  slippageBps?: number;
}
export interface SwapTokensResult {
  txHash: string;
  executionPrice?: number;
  actualSlippageBps?: number;
}