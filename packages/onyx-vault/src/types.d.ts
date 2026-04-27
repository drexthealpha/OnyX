/**
 * @onyx/vault — Types
 * Wallet interfaces. Private key NEVER appears in these types.
 * Operator cost: $0 — user provides ONYX_WALLET_PATH
 */
/** User-facing wallet configuration — loaded from env */
export interface WalletConfig {
    /** Absolute path to JSON keypair file. Set via ONYX_WALLET_PATH env var. */
    keypairPath: string;
    /** Solana RPC endpoint. Defaults to mainnet-beta if not set. */
    rpcUrl?: string;
}
/** Public-only view of a loaded wallet */
export interface Wallet {
    /** The wallet's public key — safe to expose */
    getPublicKey(): string;
    /** Sign a transaction — returns base58 signature */
    sign(transaction: Uint8Array): Promise<Uint8Array>;
    /** Sign an arbitrary message */
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    /** Get SOL balance in lamports */
    getBalance(): Promise<bigint>;
}
/** Represents an operation that was aborted before completion */
export interface AbortedOperation {
    operationId: string;
    reason: string;
    timestamp: number;
    refundAttempted: boolean;
    refundSucceeded: boolean | null;
}
//# sourceMappingURL=types.d.ts.map