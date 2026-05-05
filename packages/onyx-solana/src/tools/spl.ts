import { createSolanaRpc, address } from "@solana/kit";
import { createKeyPairSignerFromPrivateKeyBytes } from "@solana/signers";
import { readFileSync } from "fs";
import type { MCPTool } from "../types.js";

function getRpc() {
  const rpcUrl = process.env['NOSANA_RPC_URL'] || "https://api.mainnet-beta.solana.com";
  return createSolanaRpc(rpcUrl);
}

async function getSigner() {
  const path = process.env['ONYX_WALLET_PATH'];
  if (!path) throw new Error("ONYX_WALLET_PATH not set");
  const secret = JSON.parse(readFileSync(path, "utf8"));
  return createKeyPairSignerFromPrivateKeyBytes(Uint8Array.from(secret));
}

export const createTokenTool: MCPTool = {
  name: "createToken",
  description: "Create a new SPL token mint.",
  inputSchema: {
    type: "object",
    properties: {
      decimals: { type: "number", default: 9 }
    }
  },
  async execute(params: { decimals?: number }) {
    const signer = await getSigner();
    return { 
      message: "Token creation requires @solana-program/token setup with createClient().use(tokenProgram())",
      signer: signer.address 
    };
  },
};

export const mintTokenTool: MCPTool = {
  name: "mintToken",
  description: "Mint SPL tokens.",
  inputSchema: {
    type: "object",
    properties: {
      mint: { type: "string" },
      to: { type: "string" },
      amount: { type: "number" }
    },
    required: ["mint", "to", "amount"]
  },
  async execute(params: { mint: string; to: string; amount: number }) {
    const signer = await getSigner();
    return { 
      message: "Token minting requires @solana-program/token setup",
      mint: params.mint, 
      to: params.to, 
      amount: params.amount 
    };
  },
};

export const burnTokenTool: MCPTool = {
  name: "burnToken",
  description: "Burn SPL tokens.",
  inputSchema: {
    type: "object",
    properties: {
      mint: { type: "string" },
      amount: { type: "number" }
    },
    required: ["mint", "amount"]
  },
  async execute(params: { mint: string; amount: number }) {
    const signer = await getSigner();
    return { 
      message: "Token burning requires @solana-program/token setup",
      mint: params.mint, 
      amount: params.amount 
    };
  },
};

export const getTokenAccountsTool: MCPTool = {
  name: "getTokenAccounts",
  description: "Get SPL token accounts for a wallet.",
  inputSchema: {
    type: "object",
    properties: {
      wallet: { type: "string" }
    }
  },
  async execute(params: { wallet?: string }) {
    const rpc = getRpc();
    const pubkey = params.wallet || (await getSigner()).address;
    
    // Note: Full implementation would use @solana-program/token with createClient().use(tokenProgram())
    return { 
      address: pubkey,
      message: "Token account query requires @solana-program/token setup"
    };
  },
};