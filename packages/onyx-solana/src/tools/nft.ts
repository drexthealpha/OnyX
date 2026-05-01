/**
 * @onyx/solana — NFT tools
 */

import type { MCPTool } from "../types";

export const createNFTTool: MCPTool = {
  name: "createNFT",
  description: "Create a Metaplex NFT.",
  inputSchema: {} as any,
  async execute() {
    return { mint: "mock" };
  },
};

export const transferNFTTool: MCPTool = {
  name: "transferNFT",
  description: "Transfer an NFT.",
  inputSchema: {} as any,
  async execute() {
    return { signature: "mock" };
  },
};

export const getNFTMetadataTool: MCPTool = {
  name: "getNFTMetadata",
  description: "Get NFT metadata.",
  inputSchema: {} as any,
  async execute() {
    return { name: "", symbol: "", uri: "" };
  },
};