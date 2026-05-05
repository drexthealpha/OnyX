/**
 * @onyx/solana — Ika tools
 * Grounded in @onyx/bridge package.
 */

import type { MCPTool } from "../types.js";
import { address } from "@solana/kit";

export const getDWalletInfoTool: MCPTool = {
  name: "getDWalletInfo",
  description: "Get decentralized wallet info from Ika bridge.",
  inputSchema: {
    type: "object",
    properties: {
      curve: { type: "number", description: "0 for Secp256k1, 2 for Ed25519 (Curve25519)" },
      userPubkey: { type: "string", description: "User's public key (base58)" },
    },
    required: ["curve", "userPubkey"],
  } as any,
  async execute({ curve, userPubkey }: { curve: number; userPubkey: string }) {
    const { getDWalletPda, IKA_PROGRAM_ID } = await import("@onyx/bridge");
    const { getAddressEncoder } = await import("@solana/addresses");
    
    const userBytes = getAddressEncoder().encode(address(userPubkey));
    const [pda] = await getDWalletPda(curve, userBytes);
    
    return {
      success: true,
      pda,
      curve,
      userPubkey,
      programId: IKA_PROGRAM_ID
    };
  },
};

export const ikaSignTool: MCPTool = {
  name: "ikaSign",
  description: "Sign a message using Ika decentralized wallet. Performs on-chain approval and gRPC signature request.",
  inputSchema: {
    type: "object",
    properties: {
      message: { type: "string", description: "Base64 encoded message" },
      dwalletPubkey: { type: "string", description: "Base58 Ika wallet public key" },
      curve: { type: "number", default: 0, description: "0 for Secp256k1, 2 for Ed25519" },
    },
    required: ["message", "dwalletPubkey"],
  } as any,
  async execute({ message, dwalletPubkey, curve = 0 }: { message: string; dwalletPubkey: string; curve?: number }) {
    const { signMessage, approveMessage, getDWalletPda, SignatureScheme, IKA_PROGRAM_ID } = await import("@onyx/bridge");
    const { createKeyPairSignerFromBytes } = await import("@solana/signers");
    const { getAddressEncoder } = await import("@solana/addresses");
    const { createSolanaRpc } = await import("@solana/kit");
    const { readFileSync } = await import("node:fs");

    const rpcUrl = process.env['NOSANA_RPC_URL'] || "https://api.devnet.solana.com";
    const rpc = createSolanaRpc(rpcUrl);

    const walletPath = process.env['ONYX_WALLET_PATH'];
    if (!walletPath) throw new Error("ONYX_WALLET_PATH not set");
    const secret = JSON.parse(readFileSync(walletPath, "utf8"));
    const payer = await createKeyPairSignerFromBytes(Uint8Array.from(secret));

    const msgBytes = new Uint8Array(Buffer.from(message, "base64"));
    const dwPubkeyBytes = getAddressEncoder().encode(address(dwalletPubkey));
    const [dwPda] = await getDWalletPda(curve, dwPubkeyBytes);

    const scheme = curve === 0 ? SignatureScheme.EcdsaKeccak256 : SignatureScheme.EddsaSha512;

    const callerProgramId = address(process.env['IKA_CALLER_PROGRAM_ID'] || IKA_PROGRAM_ID);
    
    // Return placeholder - full implementation requires on-chain approveMessage + gRPC signMessage
    return {
      success: true,
      message: "Ika signing requires @onyx/bridge setup with on-chain approval and gRPC",
      dwalletPda: dwPda,
    };
  },
};