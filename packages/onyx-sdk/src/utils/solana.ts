// packages/onyx-sdk/src/utils/solana.ts
// Solana utility helpers for ONYX consumers

/**
 * Convert SOL (as a decimal number) to lamports (bigint).
 * 1 SOL = 1_000_000_000 lamports.
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * 1_000_000_000));
}

/**
 * Convert lamports (bigint) to SOL (number).
 */
export function lamportsToSol(lamports: bigint): number {
  return Number(lamports) / 1_000_000_000;
}

/**
 * Convert USD to USDC micro-units (6 decimal places).
 * 1 USD = 1_000_000 USDC lamports.
 */
export function usdToUsdcLamports(usd: number): bigint {
  return BigInt(Math.round(usd * 1_000_000));
}

/**
 * Convert USDC micro-units back to USD.
 */
export function usdcLamportsToUsd(lamports: bigint): number {
  return Number(lamports) / 1_000_000;
}

/**
 * Shorten a base-58 Solana public key for display.
 * e.g. "So11...1112"
 */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validate that a string looks like a base-58 Solana public key
 * (32–44 base-58 characters).
 * This is a lightweight heuristic — not cryptographic.
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Returns the Solana cluster RPC URL for a given network label.
 */
export function clusterUrl(network: 'mainnet' | 'devnet'): string {
  return network === 'mainnet'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';
}

/**
 * Returns the Solana Explorer URL for a transaction or address.
 */
export function explorerUrl(
  type: 'tx' | 'address',
  value: string,
  network: 'mainnet' | 'devnet' = 'mainnet',
): string {
  const cluster = network === 'devnet' ? '?cluster=devnet' : '';
  return `https://explorer.solana.com/${type}/${value}${cluster}`;
}