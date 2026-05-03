/**
 * @onyx/solana — Umbra privacy tools
 * Grounded in @onyx/privacy package.
 */

import type { MCPTool } from "../types.js";

export const shieldAssetTool: MCPTool = {
  name: "shieldAsset",
  description: "Shield tokens into Umbra for privacy.",
  inputSchema: {
    type: "object",
    properties: {
      token: { type: "string", description: "Token mint address" },
      amount: { type: "number", description: "Amount in smallest unit" },
      destination: { type: "string", description: "Destination stealth address" },
    },
    required: ["token", "amount", "destination"],
  } as any,
  async execute({ token, amount, destination }: { token: string; amount: number; destination: string }) {
    const privacy = await import("@onyx/privacy");
    const { Keypair } = await import("@solana/web3.js");
    const { readFileSync } = await import("fs");
    
    const walletPath = process.env['ONYX_WALLET_PATH'];
    if (!walletPath) throw new Error("ONYX_WALLET_PATH not set");
    const secret = JSON.parse(readFileSync(walletPath, "utf8"));
    const signer = Keypair.fromSecretKey(Uint8Array.from(secret));
    
    const client = await privacy.createUmbraClient({ signer });
    const result = await privacy.shieldAsset(
      client,
      privacy.createAddress(token),
      privacy.createU64(BigInt(amount)),
      privacy.createAddress(destination)
    );
    
    return { success: true, queueSignature: result.queueSignature };
  },
};

export const unshieldAssetTool: MCPTool = {
  name: "unshieldAsset",
  description: "Unshield tokens from Umbra.",
  inputSchema: {
    type: "object",
    properties: {
      token: { type: "string", description: "Token mint address" },
      amount: { type: "number", description: "Amount in smallest unit" },
      recipient: { type: "string", description: "Recipient public address" },
    },
    required: ["token", "amount", "recipient"],
  } as any,
  async execute({ token, amount, recipient }: { token: string; amount: number; recipient: string }) {
    const privacy = await import("@onyx/privacy");
    const { Keypair } = await import("@solana/web3.js");
    const { readFileSync } = await import("fs");
    
    const walletPath = process.env['ONYX_WALLET_PATH'];
    if (!walletPath) throw new Error("ONYX_WALLET_PATH not set");
    const secret = JSON.parse(readFileSync(walletPath, "utf8"));
    const signer = Keypair.fromSecretKey(Uint8Array.from(secret));
    
    const client = await privacy.createUmbraClient({ signer });
    const result = await privacy.unshieldAsset(
      client,
      privacy.createAddress(token),
      privacy.createU64(BigInt(amount)),
      privacy.createAddress(recipient)
    );
    
    return { success: true, queueSignature: result.queueSignature };
  },
};