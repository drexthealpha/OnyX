/**
 * @onyx/solana — Umbra privacy tools
 * Grounded in @onyx/privacy package.
 */

import { createKeyPairSignerFromPrivateKeyBytes } from "@solana/signers";
import { readFileSync } from "fs";
import type { MCPTool } from "../types.js";
import { createUmbraClient, shieldAsset, unshieldAsset, createAddress, createU64 } from "@onyx/privacy";

async function getSigner() {
  const path = process.env['ONYX_WALLET_PATH'];
  if (!path) throw new Error("ONYX_WALLET_PATH not set");
  const secret = JSON.parse(readFileSync(path, "utf8"));
  return createKeyPairSignerFromPrivateKeyBytes(Uint8Array.from(secret));
}

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
    const signer = await getSigner();
    
    const client = await createUmbraClient({ signer });
    const result = await shieldAsset(
      client,
      createAddress(token),
      createU64(BigInt(amount)),
      createAddress(destination)
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
    const signer = await getSigner();
    
    const client = await createUmbraClient({ signer });
    const result = await unshieldAsset(
      client,
      createAddress(token),
      createU64(BigInt(amount)),
      createAddress(recipient)
    );
    
    return { success: true, queueSignature: result.queueSignature };
  },
};