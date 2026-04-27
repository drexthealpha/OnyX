// packages/onyx-sdk/src/utils/crypto.ts
// Crypto utilities for ONYX — key derivation and hashing
// Uses Node.js built-ins (crypto). No additional dependencies.

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

/**
 * SHA-256 hash of a UTF-8 string. Returns lowercase hex.
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * SHA-512 hash of a UTF-8 string. Returns lowercase hex.
 */
export function sha512(input: string): string {
  return createHash('sha512').update(input, 'utf8').digest('hex');
}

/**
 * HMAC-SHA256.
 * @param key  Secret key (string or Buffer)
 * @param data Data to sign
 * @returns    Lowercase hex digest
 */
export function hmacSha256(key: string | Buffer, data: string): string {
  return createHmac('sha256', key).update(data, 'utf8').digest('hex');
}

/**
 * Derive a deterministic child key from a master seed and a derivation path.
 * Uses HMAC-SHA512, inspired by BIP-32 soft derivation.
 *
 * @param masterSeed  Hex string or Buffer of the master seed
 * @param path        Arbitrary derivation label, e.g. "onyx/agent/0"
 * @returns           32-byte derived key as lowercase hex
 */
export function deriveKey(masterSeed: string | Buffer, path: string): string {
  const seedBuf =
    typeof masterSeed === 'string'
      ? Buffer.from(masterSeed, 'hex')
      : masterSeed;
  const hmac = createHmac('sha512', seedBuf).update(path, 'utf8').digest();
  // Return left 32 bytes (512-bit → 256-bit child key)
  return hmac.subarray(0, 32).toString('hex');
}

/**
 * Generate cryptographically secure random bytes.
 * @param size Number of bytes (default: 32)
 * @returns    Buffer of random bytes
 */
export function secureRandom(size = 32): Buffer {
  return randomBytes(size);
}

/**
 * Generate a random hex string (2× byte count characters).
 */
export function randomHex(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Constant-time Buffer comparison to prevent timing attacks.
 */
export function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}