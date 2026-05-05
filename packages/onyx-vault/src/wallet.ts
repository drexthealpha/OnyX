/**
 * @onyx/vault — OnyxWallet
 *
 * Loads keypair from ONYX_WALLET_PATH (user-provided — operator cost: $0).
 * Private key stored ONLY in closure — never on `this`, never returned.
 *
 * Grounded in real cryptography (tweetnacl) and real chain state (@solana/kit).
 */

import { readFileSync } from "node:fs";
import { address, createSolanaRpc, lamports, signBytes, generateKeyPair, getAddressFromPublicKey } from "@solana/kit";
import { createKeyPairSignerFromBytes, createKeyPairSignerFromPrivateKeyBytes } from "@solana/signers";
import type { Wallet, WalletConfig } from "./types.js";

/** Create an OnyxWallet from the keypair at ONYX_WALLET_PATH.
 * The private key is stored in the closure and NEVER exposed on the
 * returned object.
 */
export async function createWallet(config?: Partial<WalletConfig>): Promise<Wallet> {
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
  const bytes = Uint8Array.from(rawBytes);
  
  // Support both 32-byte (private key) and 64-byte (full keypair) formats per @solana/kit docs
  let privateKey: CryptoKey;
  
  if (bytes.length === 32) {
    privateKey = await crypto.subtle.importKey(
      'raw',
      bytes,
      { name: 'Ed25519' },
      true,
      ['sign']
    );
  } else {
    // 64-byte keypair: first 32 bytes are private key
    privateKey = await crypto.subtle.importKey(
      'raw',
      bytes.slice(0, 32),
      { name: 'Ed25519' },
      true,
      ['sign']
    );
  }
  
  // Create signer from bytes
  const signer = bytes.length === 32
    ? await createKeyPairSignerFromPrivateKeyBytes(bytes)
    : await createKeyPairSignerFromBytes(bytes);
  const publicKey = signer.address;
  const rpc = createSolanaRpc(rpcUrl);

  // Zero out the source array immediately after keypair creation
  rawBytes.fill(0);
  bytes.fill(0);

  // Public API (no private key visible)
  const wallet: Wallet = {
    getPublicKey(): string {
      return publicKey;
    },

    async sign(transaction: Uint8Array): Promise<Uint8Array> {
      // Sign transaction bytes using @solana/kit signBytes
      const signature = await signBytes(privateKey, transaction);
      return signature;
    },

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
      // Sign message using @solana/kit signBytes
      const signature = await signBytes(privateKey, message);
      return signature;
    },

    async getBalance(): Promise<bigint> {
      const { value: balance } = await rpc.getBalance(address(publicKey)).send();
      return balance;
    },
  };

  console.log(
    `[onyx-vault] ✅ Wallet grounded & loaded: ${publicKey.slice(0, 8)}...`
  );

  return wallet;
}

/** Alias for createWallet */
export const OnyxWallet = { create: createWallet };