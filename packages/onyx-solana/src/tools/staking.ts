/**
 * @onyx/solana — Staking tools
 * Grounded in native Solana Staking Program.
 */

import { 
  Connection, 
  PublicKey, 
  Keypair, 
  StakeProgram, 
  Authorized, 
  Lockup, 
  sendAndConfirmTransaction,
  Transaction
} from "@solana/web3.js";
import { readFileSync } from "fs";
import type { MCPTool } from "../types.js";

function getConnection(): Connection {
  const rpc = process.env.NOSANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  return new Connection(rpc, "confirmed");
}

function getKeypair(): Keypair {
  const path = process.env.ONYX_WALLET_PATH;
  if (!path) throw new Error("ONYX_WALLET_PATH not set");
  const secret = JSON.parse(readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

export const stakeSOLTool: MCPTool = {
  name: "stakeSOL",
  description: "Stake SOL by creating a stake account and delegating it.",
  inputSchema: {
    type: "object",
    properties: {
      amount: { type: "number", description: "Amount in lamports" },
      validatorVotePubkey: { type: "string", description: "Validator vote account address" },
    },
    required: ["amount", "validatorVotePubkey"],
  } as any,
  async execute({ amount, validatorVotePubkey }: { amount: number; validatorVotePubkey: string }) {
    const connection = getConnection();
    const payer = getKeypair();
    const stakeAccount = Keypair.generate();
    const validator = new PublicKey(validatorVotePubkey);

    const createIx = StakeProgram.createAccount({
      fromPubkey: payer.publicKey,
      stakePubkey: stakeAccount.publicKey,
      authorized: new Authorized(payer.publicKey, payer.publicKey),
      lockup: new Lockup(0, 0, payer.publicKey),
      lamports: amount,
    });

    const delegateIx = StakeProgram.delegate({
      stakePubkey: stakeAccount.publicKey,
      authorizedPubkey: payer.publicKey,
      votePubkey: validator,
    });

    const tx = new Transaction().add(createIx).add(delegateIx);
    const signature = await sendAndConfirmTransaction(connection, tx, [payer, stakeAccount]);

    return { 
      success: true, 
      signature, 
      stakeAccount: stakeAccount.publicKey.toBase58() 
    };
  },
};

export const unstakeSOLTool: MCPTool = {
  name: "unstakeSOL",
  description: "Deactivate a stake account.",
  inputSchema: {
    type: "object",
    properties: {
      stakeAccount: { type: "string", description: "Stake account address" },
    },
    required: ["stakeAccount"],
  } as any,
  async execute({ stakeAccount }: { stakeAccount: string }) {
    const connection = getConnection();
    const payer = getKeypair();
    const stakePubkey = new PublicKey(stakeAccount);

    const deactivateIx = StakeProgram.deactivate({
      stakePubkey,
      authorizedPubkey: payer.publicKey,
    });

    const tx = new Transaction().add(deactivateIx);
    const signature = await sendAndConfirmTransaction(connection, tx, [payer]);

    return { success: true, signature };
  },
};

export const getStakeAccountsTool: MCPTool = {
  name: "getStakeAccounts",
  description: "Get stake accounts for a wallet.",
  inputSchema: {
    type: "object",
    properties: {
      wallet: { type: "string" },
    },
  } as any,
  async execute({ wallet }: { wallet?: string }) {
    const connection = getConnection();
    const pubkey = wallet ? new PublicKey(wallet) : getKeypair().publicKey;

    const accounts = await connection.getParsedProgramAccounts(
      StakeProgram.programId,
      {
        filters: [
          {
            memcmp: {
              offset: 12, // Offset for the authorized staker field in a stake account
              bytes: pubkey.toBase58(),
            },
          },
        ],
      }
    );

    return {
      wallet: pubkey.toBase58(),
      accounts: accounts.map(a => ({
        pubkey: a.pubkey.toBase58(),
        lamports: a.account.lamports,
      })),
    };
  },
};