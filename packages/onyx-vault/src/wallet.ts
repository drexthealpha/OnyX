/**
 * @onyx/vault — OnyxWallet
 *
 * Loads keypair from ONYX_WALLET_PATH (user-provided — operator cost: $0).
 * Private key stored ONLY in closure — never on `this`, never returned.
 *
 * Grounded in real cryptography (tweetnacl) and real chain state (@solana/web3.js).
 */

import { readFileSync } from "node:fs";
import { Connection, Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import type { Wallet, WalletConfig } from "./types.js";

/** Create an OnyxWallet from the keypair at ONYX_WALLET_PATH.
 * The private key is stored in the closure and NEVER exposed on the
 * returned object.
 */
export function createWallet(config?: Partial<WalletConfig>): Wallet {
  // User provides this — operator cost: $0
  const keypairPath =
    config?.keypairPath ??
    process.env.ONYX_WALLET_PATH ??
    (() => {
      throw new Error(
        "[onyx-vault] ONYX_WALLET_PATH is not set. " +
          "Set it to the path of your Solana keypair JSON file. " +
          "Example: export ONYX_WALLET_PATH=~/.config/solana/id.json"
      );
    })();

  // User provides this — operator cost: $0
  const rpcUrl =
    config?.rpcUrl ??
    process.env.ONYX_RPC_URL ??
    process.env.HELIUS_RPC_URL ??
    "https://api.mainnet-beta.solana.com";

  // Load keypair — private key stored in closure ONLY
  const rawBytes = JSON.parse(readFileSync(keypairPath, "utf-8")) as number[];
  const keypair = Keypair.fromSecretKey(Uint8Array.from(rawBytes));
  const publicKey = keypair.publicKey.toBase58();
  const connection = new Connection(rpcUrl, "confirmed");

  // Zero out the source array immediately after keypair creation
  rawBytes.fill(0);

  // Public API (no private key visible)
  const wallet: Wallet = {
    getPublicKey(): string {
      return publicKey;
    },

    async sign(transaction: Uint8Array): Promise<Uint8Array> {
      // nacl.sign.detached produces a 64-byte Ed25519 signature
      return nacl.sign.detached(transaction, keypair.secretKey);
    },

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
      return nacl.sign.detached(message, keypair.secretKey);
    },

    async getBalance(): Promise<bigint> {
      const balance = await connection.getBalance(keypair.publicKey);
      return BigInt(balance);
    },
  };

  console.log(
    `[onyx-vault] ✅ Wallet grounded & loaded: ${publicKey.slice(0, 8)}...`
  );

  return wallet;
}

/** Alias for createWallet */
export const OnyxWallet = { create: createWallet };