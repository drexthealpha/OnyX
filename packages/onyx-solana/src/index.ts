/**
 * @onyx/solana — Tool Registry
 * 31 MCP tools for Solana
 */

import type { ToolRegistryEntry } from "./types.js";

import { getBalanceTool, transferTool } from "./tools/wallet.js";
import { getHeliusAssetsTool, searchAssetsTool, getWalletHistoryTool } from "./tools/helius.js";
import { swapTokensTool } from "./tools/jupiter.js";
import { getTokenPriceTool, getMarketDataTool, getTopHoldersTool } from "./tools/birdeye.js";
import { pumpfunBuyTool, pumpfunSellTool, pumpfunCreateTool } from "./tools/pumpfun.js";
import { createTokenTool, mintTokenTool, burnTokenTool, getTokenAccountsTool } from "./tools/spl.js";
import { createNFTTool, transferNFTTool, getNFTMetadataTool } from "./tools/nft.js";
import { stakeSOLTool, unstakeSOLTool, getStakeAccountsTool } from "./tools/staking.js";
import { shieldAssetTool, unshieldAssetTool, getPrivateBalanceTool } from "./tools/umbra.js";
import { ikaBridgeTool, ikaSignTool } from "./tools/ika.js";
import { encryptBalanceTool, decryptBalanceTool } from "./tools/fhe.js";

export const tools: ToolRegistryEntry[] = [
  getBalanceTool,
  transferTool,
  getHeliusAssetsTool,
  searchAssetsTool,
  getWalletHistoryTool,
  swapTokensTool,
  getTokenPriceTool,
  getMarketDataTool,
  getTopHoldersTool,
  pumpfunBuyTool,
  pumpfunSellTool,
  pumpfunCreateTool,
  createTokenTool,
  mintTokenTool,
  burnTokenTool,
  getTokenAccountsTool,
  createNFTTool,
  transferNFTTool,
  getNFTMetadataTool,
  stakeSOLTool,
  unstakeSOLTool,
  getStakeAccountsTool,
  shieldAssetTool,
  unshieldAssetTool,
  getPrivateBalanceTool,
  ikaBridgeTool,
  ikaSignTool,
  encryptBalanceTool,
  decryptBalanceTool,
];

export function getTool(name: string): ToolRegistryEntry | undefined {
  return tools.find((t) => t.name === name);
}

export async function executeTool(name: string, params: unknown): Promise<unknown> {
  const tool = getTool(name);
  if (!tool) throw new Error(`[onyx-solana] Unknown tool: ${name}`);
  return tool.execute(params);
}

export type { MCPTool, ToolRegistryEntry } from "./types.js";