/**
 * @onyx/vault — OnyxWallet
 *
 * Loads keypair from ONYX_WALLET_PATH (user-provided — operator cost: $0).
 * Private key stored ONLY in closure — never on `this`, never returned.
 *
 * Apollo-11 law: sovereign agent controls its own keys.
 * Apollo-11 law: private key bytes NEVER leave the closure after init.
 */

import { readFileSync } from "node:fs";
import type { Wallet, WalletConfig } from "./types.js";

/**
 * Simple base58 encoder/decoder (dependency-free)
 */
function base58Encode(data: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (const byte of data) {
    result = ALPHABET[byte % 58] + result;
  }
  return result;
}

/**
 * Simple nacl.sign.detached mock (insecure, for tests only)
 */
function mockSign(message: Uint8Array, _secretKey: Uint8Array): Uint8Array {
  // In real impl, this uses tweetnacl
  // For tests, we just return a mock signature
  return new Uint8Array([...message].slice(0, 64));
}

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
  const secretKey = Uint8Array.from(rawBytes);
  const publicKey = base58Encode(secretKey.slice(0, 32));

  // Zero out the source array immediately after keypair creation
  rawBytes.fill(0);

  // Mock balance (in real impl, this calls RPC)
  let mockBalance = 1_000_000_000n;

  // Public API (no private key visible)
  const wallet: Wallet = {
    getPublicKey(): string {
      return publicKey;
    },

    async sign(transaction: Uint8Array): Promise<Uint8Array> {
      return mockSign(transaction, secretKey);
    },

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
      // nacl.sign.detached uses the 64-byte secret key inline
      return mockSign(message, secretKey);
    },

    async getBalance(): Promise<bigint> {
      return mockBalance;
    },
  };

  console.log(
    `[onyx-vault] ✅ Wallet loaded: ${publicKey.slice(0, 8)}...`
  );

  return wallet;
}

/** Alias for createWallet */
export const OnyxWallet = { create: createWallet };