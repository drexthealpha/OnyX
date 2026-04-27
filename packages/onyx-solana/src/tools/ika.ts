/**
 * @onyx/solana — Ika dWallet tools
 */

import type { MCPTool } from "../types.js";

export const ikaBridgeTool: MCPTool = {
  name: "ikaBridge",
  description: "Bridge via Ika (requires S15).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("[ika] @onyx/bridge not built yet - complete S15 first");
  },
};

export const ikaSignTool: MCPTool = {
  name: "ikaSign",
  description: "Sign via Ika (requires S15).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("[ika] @onyx/bridge not built yet");
  },
};