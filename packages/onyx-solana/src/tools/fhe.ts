/**
 * @onyx/solana — FHE tools
 */

import type { MCPTool } from "../types";

export const encryptBalanceTool: MCPTool = {
  name: "encryptBalance",
  description: "Encrypt balance via FHE (requires S16).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("[fhe] @onyx/fhe not built yet - complete S16 first");
  },
};

export const decryptBalanceTool: MCPTool = {
  name: "decryptBalance",
  description: "Decrypt balance via FHE (requires S16).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("[fhe] @onyx/fhe not built yet");
  },
};