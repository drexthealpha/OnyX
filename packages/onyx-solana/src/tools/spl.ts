import { 
  Connection, 
  PublicKey, 
  Keypair 
} from "@solana/web3.js";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  burn,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
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
    const connection = getConnection();
    const payer = getKeypair();
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      params.decimals ?? 9
    );
    return { mint: mint.toBase58() };
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
    const connection = getConnection();
    const payer = getKeypair();
    const mint = new PublicKey(params.mint);
    const to = new PublicKey(params.to);

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      to
    );

    const signature = await mintTo(
      connection,
      payer,
      mint,
      ata.address,
      payer,
      params.amount
    );

    return { signature, mint: params.mint, to: params.to, amount: params.amount };
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
    const connection = getConnection();
    const payer = getKeypair();
    const mint = new PublicKey(params.mint);

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );

    const signature = await burn(
      connection,
      payer,
      ata.address,
      mint,
      payer,
      params.amount
    );

    return { signature, mint: params.mint, amount: params.amount };
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
    const connection = getConnection();
    const pubkey = params.wallet ? new PublicKey(params.wallet) : getKeypair().publicKey;

    const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID
    });

    return { 
      address: pubkey.toBase58(),
      accounts: accounts.value.map(a => ({
        mint: a.account.data.parsed.info.mint,
        amount: a.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: a.account.data.parsed.info.tokenAmount.decimals
      }))
    };
  },
};