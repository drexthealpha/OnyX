/**
 * @onyx/solana — Ika tools
 * Grounded in @onyx/bridge package.
 */

import type { MCPTool } from "../types.js";

export const getDWalletInfoTool: MCPTool = {
  name: "getDWalletInfo",
  description: "Get decentralized wallet info from Ika bridge.",
  inputSchema: {
    type: "object",
    properties: {
      curve: { type: "number", description: "0 for Secp256k1, 1 for Ed25519" },
      userPubkey: { type: "string", description: "User's public key (base58)" },
    },
    required: ["curve", "userPubkey"],
  } as any,
  async execute({ curve, userPubkey }: { curve: number; userPubkey: string }) {
    // @ts-ignore
    const bridge = await import("@onyx/bridge");
    const { PublicKey } = await import("@solana/web3.js");
    
    const userBytes = new PublicKey(userPubkey).toBytes();
    const [pda] = bridge.getDWalletPda(curve, userBytes);
    
    return {
      success: true,
      pda: pda.toBase58(),
      curve,
      userPubkey
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
      curve: { type: "number", default: 0, description: "0 for Secp256k1, 1 for Ed25519" },
    },
    required: ["message", "dwalletPubkey"],
  } as any,
  async execute({ message, dwalletPubkey, curve = 0 }: { message: string; dwalletPubkey: string; curve?: number }) {
    // @ts-ignore
    const { signMessage, approveMessage, getDWalletPda } = await import("@onyx/bridge");
    const { Connection, Keypair, PublicKey } = await import("@solana/web3.js");
    const { readFileSync } = await import("node:fs");

    const rpc = process.env['NOSANA_RPC_URL'] || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpc, "confirmed");

    const walletPath = process.env['ONYX_WALLET_PATH'];
    if (!walletPath) throw new Error("ONYX_WALLET_PATH not set");
    const secret = JSON.parse(readFileSync(walletPath, "utf8"));
    const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

    const msgBytes = Buffer.from(message, "base64");
    const dwPubkeyBytes = new PublicKey(dwalletPubkey).toBytes();
    const [dwPda] = getDWalletPda(curve, payer.publicKey.toBytes());

    // 1. Approve on-chain
    const txSig = await approveMessage({
      connection,
      dwalletInfo: {
        pda: dwPda.toBase58(),
        pubkey: dwPubkeyBytes,
        curve
      },
      message: msgBytes,
      signatureScheme: curve === 0 ? 0 : 3, // 0 for EcdsaKeccak256, 3 for EddsaSha512
      userPubkey: payer.publicKey.toBytes(),
      payer
    });

    // 2. Request signature from MPC network
    const signature = await signMessage({
      connection,
      dwalletInfo: {
        pda: dwPda.toBase58(),
        pubkey: dwPubkeyBytes,
        curve
      },
      message: msgBytes,
      signatureScheme: curve === 0 ? 0 : 3,
      userPubkey: payer.publicKey.toBytes(),
      signer: payer
    });

    return {
      success: true,
      txSig,
      signature: Buffer.from(signature).toString("base64"),
      dwalletPubkey,
    };
  },
};