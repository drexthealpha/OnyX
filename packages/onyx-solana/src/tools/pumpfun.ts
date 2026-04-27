/**
 * @onyx/solana — PumpFun tools
 */

import type { MCPTool } from "../types.js";

export const pumpfunBuyTool: MCPTool = {
  name: "pumpfunBuy",
  description: "Buy a PumpFun token.",
  inputSchema: {} as any,
  async execute() {
    return { simulated: true };
  },
};

export const pumpfunSellTool: MCPTool = {
  name: "pumpfunSell",
  description: "Sell a PumpFun token.",
  inputSchema: {} as any,
  async execute() {
    return { simulated: true };
  },
};

export const pumpfunCreateTool: MCPTool = {
  name: "pumpfunCreate",
  description: "Create a PumpFun token.",
  inputSchema: {} as any,
  async execute() {
    return { mint: "mock" };
  },
};