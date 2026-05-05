import type { Address } from '@solana/kit';
import type { U64, U128, U256, U512 } from '@umbra-privacy/sdk/types';
import type { Network } from '@umbra-privacy/sdk/constants';

export type { Address, U64, U128, U256, U512, Network };

export type UmbraNetwork = 'mainnet' | 'devnet' | 'localnet';

export function createAddress(raw: string): Address {
  return raw as Address;
}

export function createU64(raw: bigint): U64 {
  if (raw < 0n) {
    throw new RangeError('[onyx-privacy] createU64: value must be >= 0');
  }
  const MAX_U64 = 2n ** 64n - 1n;
  if (raw > MAX_U64) {
    throw new RangeError('[onyx-privacy] createU64: value exceeds U64_MAX');
  }
  return raw as U64;
}

export interface DepositResult {
  queueSignature: string;
  callbackStatus?: 'finalized' | 'pruned' | 'timed-out';
  callbackSignature?: string;
  callbackElapsedMs?: number;
  rentClaimSignature?: string;
  rentClaimError?: string;
}

export interface WithdrawResult {
  queueSignature: string;
  callbackStatus?: 'finalized' | 'pruned' | 'timed-out';
  callbackSignature?: string;
  callbackElapsedMs?: number;
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
  return (amount * BigInt(bps)) / 16384n;
}

export const TOKENS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  wSOL: 'So11111111111111111111111111111111111111112',
  UMBRA: 'PRVT6TB7uss3FrUd2D9xs2zqDBsa3GbMJMwCQsgmeta',
} as const;

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
  recipientAddress: string;
  amount: bigint;
  mint: string;
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
  mint: string;
  amount: bigint;
  recipientAddress: string;
  expiresAt?: number;
  memo?: string;
}

export interface GiftCard {
  id: string;
  mint: string;
  amount: bigint;
  claimCode: string;
  utxoSignatures: string[];
  expiresAt?: number;
}

export interface Invoice {
  id: string;
  issuer: string;
  recipient: string;
  items: Array<{ description: string; amount: bigint; mint: string }>;
  total: bigint;
  mint: string;
  dueAt: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentLink?: string;
}

export interface X402PrivatePaymentParams {
  client: unknown;
  amount: bigint;
  mint: string;
  recipientAddress: string;
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