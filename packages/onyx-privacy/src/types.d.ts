export type U64 = bigint & {
    readonly _brand: 'U64';
};
export type U128 = bigint & {
    readonly _brand: 'U128';
};
export type U256 = bigint & {
    readonly _brand: 'U256';
};
export type Address = string & {
    readonly _brand: 'Address';
};
export declare function createU64(raw: bigint): U64;
export declare function createU128(raw: bigint): U128;
export declare function createU256(raw: bigint): U256;
export declare function createAddress(raw: string): Address;
export interface DepositResult {
    queueSignature: string;
    callbackSignature: string;
}
export interface WithdrawResult {
    queueSignature: string;
    callbackStatus: string;
    callbackSignature: string;
    callbackElapsedMs: number;
}
export interface ClaimResult {
    requestId: string;
    status: 'completed' | 'failed' | 'timed_out';
    signature?: string;
    elapsedMs: number;
}
export interface UTXOScanResult {
    selfBurnable: unknown[];
    received: unknown[];
    publicSelfBurnable: unknown[];
    publicReceived: unknown[];
}
export declare function protocolFee(amount: bigint, bps: number): bigint;
export declare const TOKENS: {
    readonly USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    readonly USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
    readonly wSOL: "So11111111111111111111111111111111111111112";
    readonly UMBRA: "PRVT6TB7uss3FrUd2D9xs2zqDBsa3GbMJMwCQsgmeta";
};
export type UmbraNetwork = 'mainnet' | 'devnet' | 'localnet';
export declare const PROGRAM_IDS: Record<UmbraNetwork, string>;
export interface StealthPayment {
    stealthAddress: string;
    amount: bigint;
    mint: string;
    txSignature: string;
}
export interface ComplianceReport {
    address: string;
    period: {
        start: number;
        end: number;
    };
    inflows: Array<{
        mint: string;
        amount: bigint;
        timestamp: number;
        txSignature: string;
    }>;
    outflows: Array<{
        mint: string;
        amount: bigint;
        timestamp: number;
        txSignature: string;
    }>;
    netBalances: Record<string, bigint>;
}
export interface PayrollEntry {
    recipientAddress: Address;
    amount: U64;
    mint: Address;
    memo?: string;
}
export interface PayrollResult {
    recipientAddress: string;
    amount: bigint;
    utxoSignatures: string[];
    status: 'sent' | 'failed';
    error?: string;
}
export interface PaymentLink {
    id: string;
    url: string;
    mint: Address;
    amount: U64;
    recipientAddress: Address;
    expiresAt?: number;
    memo?: string;
}
export interface GiftCard {
    id: string;
    mint: Address;
    amount: U64;
    claimCode: string;
    utxoSignatures: string[];
    expiresAt?: number;
}
export interface Invoice {
    id: string;
    issuer: Address;
    recipient: Address;
    items: Array<{
        description: string;
        amount: U64;
        mint: Address;
    }>;
    total: U64;
    mint: Address;
    dueAt: number;
    status: 'pending' | 'paid' | 'overdue';
    paymentLink?: string;
}
export interface X402PrivatePaymentParams {
    client: unknown;
    amount: U64;
    mint: Address;
    recipientAddress: Address;
    paymentReference: string;
    network?: UmbraNetwork;
}
export interface X402PaymentResult {
    signature: string;
    paymentToken: string;
}
export interface X402PaymentVerification {
    verified: boolean;
    amount: bigint;
    mint: string;
}
//# sourceMappingURL=types.d.ts.map