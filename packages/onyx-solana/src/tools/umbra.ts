/**
 * @onyx/solana — Umbra privacy tools
 */

import type { MCPTool } from "../types.js";

export const shieldAssetTool: MCPTool = {
  name: "shieldAsset",
  description: "Shield tokens into Umbra (requires S14).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("[umbra] @onyx/privacy not built yet - complete S14 first");
  },
};

export const unshieldAssetTool: MCPTool = {
  name: "unshieldAsset",
  description: "Unshield tokens from Umbra (requires S14).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("[umbra] @onyx/privacy not built yet");
  },
};

export const getPrivateBalanceTool: MCPTool = {
  name: "getPrivateBalance",
  description: "Get private balance in Umbra (requires S14).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("[umbra] @onyx/privacy not built yet");
  },
};