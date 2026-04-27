/**
 * Helius on-chain token data
 * API key: user's HELIUS_API_KEY env var (operator cost $0)
 * Docs: https://docs.helius.dev/
 */
export interface TokenMetadata {
    mint: string;
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    holders: number;
    mintAuthority: string | null;
    freezeAuthority: string | null;
    updateAuthority: string | null;
}
export declare function fetchTokenMetadata(mint: string): Promise<TokenMetadata>;
export interface TransactionStats {
    mint: string;
    count24h: number;
    uniqueSigners24h: number;
    volumeSol24h: number;
}
export declare function fetchTransactionStats(mint: string): Promise<TransactionStats>;
//# sourceMappingURL=helius.d.ts.map