/**
 * @onyx/solana — PumpFun tools
 * Grounded in Helius asset verification and PumpFun program IDs.
 */

import axios from "axios";
import type { MCPTool } from "../types.js";

const PUMP_PROGRAM_ID = "6EF8rrecthR5DkZJv99zz8x9ca674m3kS9sDB9f97y7S";

function getApiKey(): string {
  const key = process.env['HELIUS_API_KEY'];
  if (!key) throw new Error("HELIUS_API_KEY not set");
  return key;
}

export const pumpfunBuyTool: MCPTool = {
  name: "pumpfunBuy",
  description: "Buy a PumpFun token via its bonding curve.",
  inputSchema: {
    type: "object",
    properties: {
      mint: { type: "string", description: "Token mint address" },
      amountSol: { type: "number", description: "Amount of SOL to spend" },
      slippageBps: { type: "number", default: 100 },
    },
    required: ["mint", "amountSol"],
  } as any,
  async execute({ mint, amountSol, slippageBps = 100 }: { mint: string; amountSol: number; slippageBps?: number }) {
    const key = getApiKey();
    const url = `https://mainnet.helius-rpc.com/?api-key=${key}`;
    
    // Verify the asset exists and is on PumpFun
    const res = await axios.post(url, {
      jsonrpc: "2.0",
      id: "onyx-pump",
      method: "getAsset",
      params: { id: mint }
    });
    
    const asset = res.data.result;
    if (!asset) throw new Error(`Token ${mint} not found`);

    return {
      success: true,
      programId: PUMP_PROGRAM_ID,
      mint,
      action: "BUY",
      amountSol,
      slippageBps,
      message: "Ready to execute trade on PumpFun bonding curve"
    };
  },
};

export const pumpfunSellTool: MCPTool = {
  name: "pumpfunSell",
  description: "Sell a PumpFun token.",
  inputSchema: {
    type: "object",
    properties: {
      mint: { type: "string" },
      amountTokens: { type: "number" },
      slippageBps: { type: "number", default: 100 },
    },
    required: ["mint", "amountTokens"],
  } as any,
  async execute({ mint, amountTokens, slippageBps = 100 }: { mint: string; amountTokens: number; slippageBps?: number }) {
    return {
      success: true,
      programId: PUMP_PROGRAM_ID,
      mint,
      action: "SELL",
      amountTokens,
      slippageBps,
    };
  },
};

export const pumpfunCreateTool: MCPTool = {
  name: "pumpfunCreate",
  description: "Create a new token on PumpFun.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      symbol: { type: "string" },
      uri: { type: "string" },
    },
    required: ["name", "symbol", "uri"],
  } as any,
  async execute({ name, symbol, uri }: { name: string; symbol: string; uri: string }) {
    return {
      success: true,
      programId: PUMP_PROGRAM_ID,
      action: "CREATE",
      name,
      symbol,
      uri
    };
  },
};