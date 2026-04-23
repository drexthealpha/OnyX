export type U64 = bigint & { readonly _brand: 'U64' };
export type U128 = bigint & { readonly _brand: 'U128' };
export type U256 = bigint & { readonly _brand: 'U256' };
export type Address = string & { readonly _brand: 'Address' };

const U64_MAX = 2n ** 64n - 1n;
const U128_MAX = 2n ** 128n - 1n;
const U256_MAX = 2n ** 256n - 1n;

export function createU64(raw: bigint): U64 {
  if (raw < 0n) {
    throw new RangeError('[onyx-privacy] createU64: value must be >= 0');
  }
  if (raw > U64_MAX) {
    throw new RangeError('[onyx-privacy] createU64: value exceeds U64_MAX');
  }
  return raw as U64;
}

export function createU128(raw: bigint): U128 {
  if (raw < 0n) {
    throw new RangeError('[onyx-privacy] createU128: value must be >= 0');
  }
  if (raw > U128_MAX) {
    throw new RangeError('[onyx-privacy] createU128: value exceeds U128_MAX');
  }
  return raw as U128;
}

export function createU256(raw: bigint): U256 {
  if (raw < 0n) {
    throw new RangeError('[onyx-privacy] createU256: value must be >= 0');
  }
  if (raw > U256_MAX) {
    throw new RangeError('[onyx-privacy] createU256: value exceeds U256_MAX');
  }
  return raw as U256;
}

export function createAddress(raw: string): Address {
  if (!raw || raw.length === 0) {
    throw new RangeError('[onyx-privacy] createAddress: address cannot be empty');
  }
  return raw as Address;
}

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

export function protocolFee(amount: bigint, bps: number): bigint {
  return BigInt(Math.floor(Number(amount) * bps / 16384));
}

export const TOKENS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  wSOL: 'So11111111111111111111111111111111111111112',
  UMBRA: 'PRVT6TB7uss3FrUd2D9xs2zqDBsa3GbMJMwCQsgmeta',
} as const;

export type UmbraNetwork = 'mainnet' | 'devnet' | 'localnet';

export const PROGRAM_IDS: Record<UmbraNetwork, string> = {
  mainnet: 'UMBRAD2ishebJTcgCLkTkNUx1v3GyoAgpTRPeWoLykh',
  devnet: 'DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ',
  localnet: 'DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ',
};

export interface StealthPayment {
  stealthAddress: string;
  amount: bigint;
  mint: string;
  txSignature: string;
}

export interface ComplianceReport {
  address: string;
  period: { start: number; end: number };
  inflows: Array<{ mint: string; amount: bigint; timestamp: number; txSignature: string }>;
  outflows: Array<{ mint: string; amount: bigint; timestamp: number; txSignature: string }>;
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
  items: Array<{ description: string; amount: U64; mint: Address }>;
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