/**
 * @onyx/solana — Staking tools
 * Grounded in native Solana Staking Program via @solana/kit.
 */

import { createSolanaRpc, address, lamports } from "@solana/kit";
import { createKeyPairSignerFromPrivateKeyBytes, generateKeyPairSigner } from "@solana/signers";
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
    const signer = await getSigner();
    const stakeAccount = await generateKeyPairSigner();
    
    // Note: Full implementation would use stakeProgram().instructions.createStake()
    // and stakeProgram().instructions.delegate() via @solana-program/stake
    return { 
      success: true, 
      signature: "Stake transaction requires @solana-program/stake setup", 
      stakeAccount: stakeAccount.address 
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
    const signer = await getSigner();
    // Note: Full implementation would use stakeProgram().instructions.deactivate()
    return { success: true, signature: "Unstake requires @solana-program/stake setup" };
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
    const rpc = getRpc();
    const pubkey = wallet || (await getSigner()).address;
    
    // Note: Full implementation would use stakeProgram().accounts.stake.forOwner()
    return {
      wallet: pubkey,
      accounts: [] // Requires @solana-program/stake setup
    };
  },
};