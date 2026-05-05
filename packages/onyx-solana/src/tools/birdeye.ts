/**
 * @onyx/solana — BirdEye tools
 * Grounded in real-time BirdEye DeFi API.
 */

import axios from "axios";
import type { MCPTool } from "../types.js";

const BASE = "https://public-api.birdeye.so";

function getApiKey(): string {
  const key = process.env['BIRDEYE_API_KEY'];
  if (!key) throw new Error("BIRDEYE_API_KEY env var not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    "X-API-KEY": getApiKey(),
    "x-chain": "solana",
    "accept": "application/json",
  };
}

export const getTokenPriceTool: MCPTool = {
  name: "getTokenPrice",
  description: "Get real-time token price in USD.",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "Token mint address" },
    },
    required: ["address"],
  } as any,
  async execute({ address }: { address: string }) {
    const res = await axios.get(`${BASE}/defi/price`, {
      headers: headers(),
      params: { address },
    });
    return { 
      address,
      price: res.data?.data?.value ?? 0,
      timestamp: Date.now()
    };
  },
};

export const getMarketDataTool: MCPTool = {
  name: "getMarketData",
  description: "Get market data for a token (price, volume, mkt cap, etc).",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "Token mint address" },
    },
    required: ["address"],
  } as any,
  async execute({ address }: { address: string }) {
    const res = await axios.get(`${BASE}/defi/token_overview`, {
      headers: headers(),
      params: { address },
    });
    const d = res.data?.data ?? {};
    return {
      address,
      symbol: d.symbol ?? "",
      name: d.name ?? "",
      price: d.price ?? 0,
      priceChange24h: d.priceChange24hPercent ?? 0,
      volume24h: d.v24hUSD ?? 0,
      marketCap: d.mc ?? 0,
      liquidity: d.liquidity ?? 0,
      holders: d.holder ?? 0,
    };
  },
};

export const getTopHoldersTool: MCPTool = {
  name: "getTopHolders",
  description: "Get top token holders for a specific mint.",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "Token mint address" },
      limit: { type: "number", default: 10 },
    },
    required: ["address"],
  } as any,
  async execute({ address, limit = 10 }: { address: string; limit?: number }) {
    const res = await axios.get(`${BASE}/defi/token_holder_list`, {
      headers: headers(),
      params: { address, limit, offset: 0 },
    });
    const items = res.data?.data?.items ?? [];
    return {
      address,
      holders: items.map((item: { owner: string; amount: string; ui_amount: string }) => ({
        owner: item.owner,
        amount: item.amount,
        uiAmount: item.ui_amount,
      })),
    };
  },
};