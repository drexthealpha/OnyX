/**
 * Token resolution and metadata
 * Maps symbols to mint addresses and handles decimal conversion.
 */

import { fetchTokenOverview } from './birdeye.js';

export const COMMON_TOKENS: Record<string, string> = {
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'SOL': 'So11111111111111111111111111111111111111112',
  'WSOL': 'So11111111111111111111111111111111111111112',
};

export interface TokenInfo {
  mint: string;
  symbol: string;
  decimals: number;
}

/**
 * Resolves a symbol or address to a full TokenInfo object.
 * Priority: 1. Common Tokens map, 2. Birdeye API lookup.
 */
export async function resolveToken(token: string): Promise<TokenInfo> {
  // If it's already a base58 mint address (heuristic: length > 32)
  if (token.length >= 32 && !token.includes(' ')) {
    const overview = await fetchTokenOverview(token);
    return {
      mint: token,
      symbol: overview.symbol,
      decimals: overview.decimals,
    };
  }

  const symbol = token.toUpperCase();
  const commonMint = COMMON_TOKENS[symbol];
  
  if (commonMint) {
    const overview = await fetchTokenOverview(commonMint);
    return {
      mint: commonMint,
      symbol: symbol,
      decimals: overview.decimals,
    };
  }

  // Fallback: search Birdeye? (For now just throw if not found)
  throw new Error(`[onyx-trading] Unable to resolve token symbol: ${token}. Please provide a mint address.`);
}
/**
 * Resolves a mint address to a symbol.
 */
export async function reverseResolveToken(mint: string): Promise<string> {
  for (const [symbol, m] of Object.entries(COMMON_TOKENS)) {
    if (m === mint) return symbol;
  }
  try {
    const overview = await fetchTokenOverview(mint);
    return overview.symbol || mint;
  } catch {
    return mint;
  }
}
