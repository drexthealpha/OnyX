import axios from "axios";
import type { MCPTool } from "../types.js";

function getApiKey(): string {
  const key = process.env['HELIUS_API_KEY'];
  if (!key) throw new Error("HELIUS_API_KEY not set");
  return key;
}

const getHeliusAssetsTool: MCPTool = {
  name: "getHeliusAssets",
  description: "Get digital assets owned by a wallet via Helius DAS API.",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string" },
      page: { type: "number", default: 1 }
    },
    required: ["owner"]
  },
  async execute(params: { owner: string; page?: number }) {
    const key = getApiKey();
    const url = `https://mainnet.helius-rpc.com/?api-key=${key}`;
    
    const response = await axios.post(url, {
      jsonrpc: "2.0",
      id: "onyx-mcp",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: params.owner,
        page: params.page ?? 1,
        limit: 100
      }
    });

    return { 
      owner: params.owner, 
      assets: response.data.result.items 
    };
  },
};

const searchAssetsTool: MCPTool = {
  name: "searchAssets",
  description: "Search for Solana digital assets.",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string" },
      grouping: { type: "array", items: { type: "string" } }
    },
    required: ["owner"]
  },
  async execute(params: { owner: string; grouping?: string[] }) {
    const key = getApiKey();
    const url = `https://mainnet.helius-rpc.com/?api-key=${key}`;
    
    const response = await axios.post(url, {
      jsonrpc: "2.0",
      id: "onyx-mcp",
      method: "searchAssets",
      params: {
        ownerAddress: params.owner,
        grouping: params.grouping,
        page: 1,
        limit: 100
      }
    });

    return { 
      results: response.data.result.items 
    };
  },
};

const getWalletHistoryTool: MCPTool = {
  name: "getWalletHistory",
  description: "Get transaction history for a wallet.",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string" }
    },
    required: ["address"]
  },
  async execute(params: { address: string }) {
    const key = getApiKey();
    const url = `https://api.helius.xyz/v0/addresses/${params.address}/transactions?api-key=${key}`;
    
    const response = await axios.get(url);

    return { 
      address: params.address, 
      transactions: response.data 
    };
  },
};

export { getHeliusAssetsTool, searchAssetsTool, getWalletHistoryTool };