/**
 * @onyx/solana — NFT tools
 * Grounded in Helius DAS API.
 */

import axios from "axios";
import type { MCPTool } from "../types.js";

function getApiKey(): string {
  const key = process.env.HELIUS_API_KEY;
  if (!key) throw new Error("HELIUS_API_KEY not set");
  return key;
}

export const getNFTMetadataTool: MCPTool = {
  name: "getNFTMetadata",
  description: "Get NFT metadata using Helius DAS API.",
  inputSchema: {
    type: "object",
    properties: {
      mint: { type: "string", description: "NFT mint address" },
    },
    required: ["mint"],
  } as any,
  async execute({ mint }: { mint: string }) {
    const key = getApiKey();
    const url = `https://mainnet.helius-rpc.com/?api-key=${key}`;
    
    const response = await axios.post(url, {
      jsonrpc: "2.0",
      id: "onyx-nft",
      method: "getAsset",
      params: { id: mint }
    });

    const d = response.data.result;
    if (!d) throw new Error(`Asset ${mint} not found`);

    return {
      mint,
      name: d.content?.metadata?.name ?? "",
      symbol: d.content?.metadata?.symbol ?? "",
      uri: d.content?.json_uri ?? "",
      image: d.content?.links?.image ?? "",
      owner: d.ownership?.owner ?? "",
      grouping: d.grouping ?? [],
    };
  },
};

// Placeholders for create/transfer until Metaplex is added
export const createNFTTool: MCPTool = {
  name: "createNFT",
  description: "Create a Metaplex NFT (requires Metaplex SDK).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("createNFT requires Metaplex SDK - coming in Phase 2 grounding");
  },
};

export const transferNFTTool: MCPTool = {
  name: "transferNFT",
  description: "Transfer an NFT (requires Metaplex SDK).",
  inputSchema: {} as any,
  async execute() {
    throw new Error("transferNFT requires Metaplex SDK");
  },
};