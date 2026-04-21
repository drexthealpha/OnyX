/**
 * @onyx/kernel
 * ONYX — Sovereign AI OS on Solana
 */

export const NAME = "kernel";
export const VERSION = "0.0.1";

export const GATEWAY_PORT = 18791;
export const RL_PORT = 19001;

export enum AbortCode {
  TIMEOUT = "TIMEOUT",
  PANIC = "PANIC",
  LAW_VIOLATION = "LAW_VIOLATION",
}

export function abort(code: AbortCode | string, reason?: string): never {
  console.error(`[kernel] ABORT ${code}${reason ? `: ${reason}` : ""}`);
  process.exit(1);
}