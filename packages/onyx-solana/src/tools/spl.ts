/**
 * @onyx/solana — SPL Token tools
 */

import type { MCPTool } from "../types.js";

export const createTokenTool: MCPTool = {
  name: "createToken",
  description: "Create a new SPL token mint.",
  inputSchema: {} as any,
  async execute() {
    return { mint: "mock" };
  },
};

export const mintTokenTool: MCPTool = {
  name: "mintToken",
  description: "Mint SPL tokens.",
  inputSchema: {} as any,
  async execute() {
    return { signature: "mock" };
  },
};

export const burnTokenTool: MCPTool = {
  name: "burnToken",
  description: "Burn SPL tokens.",
  inputSchema: {} as any,
  async execute() {
    return { signature: "mock" };
  },
};

export const getTokenAccountsTool: MCPTool = {
  name: "getTokenAccounts",
  description: "Get SPL token accounts for a wallet.",
  inputSchema: {} as any,
  async execute() {
    return { accounts: [] };
  },
};