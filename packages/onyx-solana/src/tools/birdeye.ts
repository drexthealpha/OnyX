/**
 * @onyx/solana — BirdEye tools
 */

import type { MCPTool } from "../types";

export const getTokenPriceTool: MCPTool = {
  name: "getTokenPrice",
  description: "Get real-time token price in USD.",
  inputSchema: {} as any,
  async execute() {
    return { price: 0 };
  },
};

export const getMarketDataTool: MCPTool = {
  name: "getMarketData",
  description: "Get market data for a token.",
  inputSchema: {} as any,
  async execute() {
    return { marketCap: 0 };
  },
};

export const getTopHoldersTool: MCPTool = {
  name: "getTopHolders",
  description: "Get top token holders.",
  inputSchema: {} as any,
  async execute() {
    return { holders: [] };
  },
};