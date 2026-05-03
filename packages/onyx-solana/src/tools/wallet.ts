import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { readFileSync } from "fs";
import type { MCPTool } from "../types.js";

function getConnection(): Connection {
  const rpc = process.env['NOSANA_RPC_URL'] || "https://api.mainnet-beta.solana.com";
  return new Connection(rpc, "confirmed");
}

function getKeypair(): Keypair {
  const path = process.env['ONYX_WALLET_PATH'];
  if (!path) throw new Error("ONYX_WALLET_PATH not set");
  const secret = JSON.parse(readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

export const getBalanceTool: MCPTool = {
  name: "getBalance",
  description: "Get SOL balance for the ONYX wallet or any public address",
  inputSchema: {
    type: "object",
    properties: {
      wallet: { type: "string", description: "Public address to check balance for" }
    }
  },
  async execute(params: { wallet?: string }) {
    const connection = getConnection();
    const pubkey = params.wallet ? new PublicKey(params.wallet) : getKeypair().publicKey;
    const lamports = await connection.getBalance(pubkey);
    return { 
      address: pubkey.toBase58(), 
      lamports, 
      sol: lamports / LAMPORTS_PER_SOL 
    };
  },
};

export const transferTool: MCPTool = {
  name: "transfer",
  description: "Transfer SOL from the ONYX agent wallet to a recipient.",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient public address" },
      lamports: { type: "number", description: "Amount in lamports to transfer" }
    },
    required: ["to", "lamports"]
  },
  async execute(params: { to: string; lamports: number }) {
    const connection = getConnection();
    const from = getKeypair();
    const to = new PublicKey(params.to);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: params.lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [from]);

    return { 
      success: true,
      signature, 
      from: from.publicKey.toBase58(), 
      to: to.toBase58(), 
      lamports: params.lamports 
    };
  },
};