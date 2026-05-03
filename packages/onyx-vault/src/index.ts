/**
 * @onyx/vault — Public API
 */
export { createWallet, OnyxWallet } from "./wallet.js";
export { withAbort } from "./abort.js";
export type { Wallet, WalletConfig, AbortedOperation } from "./types.js";

/**
 * Vault Management API (Library Mode)
 */

export async function getBalance() {
  const { createWallet } = await import("./wallet.js");
  const wallet = createWallet();
  const lamports = await wallet.getBalance();
  return {
    sol: Number(lamports) / 1e9,
    lamports: lamports.toString(),
  };
}

export async function getPublicKey() {
  const { createWallet } = await import("./wallet.js");
  const wallet = createWallet();
  return wallet.getPublicKey();
}

export async function signTransaction(txData: Uint8Array) {
  const { createWallet } = await import("./wallet.js");
  const wallet = createWallet();
  return wallet.sign(txData);
}

/**
 * Get transaction history via Helius (placeholder for real integration)
 */
export async function getTransactionHistory(address?: string) {
  const { createWallet } = await import("./wallet.js");
  const wallet = createWallet();
  const pubkey = address || wallet.getPublicKey();
  
  const key = process.env.HELIUS_API_KEY;
  if (!key) return [];
  
  const res = await fetch(`https://api.helius.xyz/v0/addresses/${pubkey}/transactions?api-key=${key}`);
  return res.json();
}