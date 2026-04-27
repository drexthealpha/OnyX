/**
 * @onyx/solana — Staking tools
 */

import type { MCPTool } from "../types.js";

export const stakeSOLTool: MCPTool = {
  name: "stakeSOL",
  description: "Stake SOL with a validator.",
  inputSchema: {} as any,
  async execute() {
    return { signature: "mock" };
  },
};

export const unstakeSOLTool: MCPTool = {
  name: "unstakeSOL",
  description: "Deactivate a stake account.",
  inputSchema: {} as any,
  async execute() {
    return { signature: "mock" };
  },
};

export const getStakeAccountsTool: MCPTool = {
  name: "getStakeAccounts",
  description: "Get stake accounts for a wallet.",
  inputSchema: {} as any,
  async execute() {
    return { accounts: [] };
  },
};