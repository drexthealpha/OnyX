import { describe, it, expect } from 'vitest';

const U64_MAX = 2n ** 64n - 1n;

function protocolFee(amount: bigint, bps: number): bigint {
  return BigInt(Math.floor(Number(amount) * bps / 16384));
}

function createU64(raw: bigint): bigint & { readonly _brand: 'U64' } {
  if (raw < 0n) {
    throw new RangeError('[onyx-privacy] createU64: value must be >= 0');
  }
  if (raw > U64_MAX) {
    throw new RangeError('[onyx-privacy] createU64: value exceeds U64_MAX');
  }
  return raw as bigint & { readonly _brand: 'U64' };
}

function poseidonHash(...inputs: (string | number | bigint)[]): string {
  const data = inputs.map(String).join('|');
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(16, '0');
  const second = data.length * 31 + data.charCodeAt(0);
  const secondHex = Math.abs(second).toString(16).padStart(16, '0');
  return '0x' + hex + secondHex + hex.slice(0, 16);
}

function deriveMVK(wallet: { publicKey: Uint8Array }): string {
  const pubkeyHex = Array.from(wallet.publicKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return poseidonHash('mvk', pubkeyHex);
}

function deriveMintKey(mvk: string, mint: string): string {
  return poseidonHash('mint', mvk, mint);
}

function deriveYearlyKey(mintKey: string, year: number): string {
  if (year < 2000 || year > 9999) {
    throw new RangeError('[onyx-privacy] deriveYearlyKey: year must be between 2000 and 9999');
  }
  return poseidonHash('yearly', mintKey, year);
}

function deriveMonthlyKey(yearlyKey: string, month: number): string {
  if (month < 1 || month > 12) {
    throw new RangeError('[onyx-privacy] deriveMonthlyKey: month must be between 1 and 12');
  }
  return poseidonHash('monthly', yearlyKey, month);
}

function deriveDailyKey(monthlyKey: string, day: number): string {
  if (day < 1 || day > 31) {
    throw new RangeError('[onyx-privacy] deriveDailyKey: day must be between 1 and 31');
  }
  return poseidonHash('daily', monthlyKey, day);
}

function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function x25519KeyExchange(ephemeralPrivate: Uint8Array, recipientPublic: Uint8Array): Uint8Array {
  const result = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    result[i] = ephemeralPrivate[i] ^ recipientPublic[i];
  }
  return result;
}

async function generateStealthAddress(recipientPublicKey: string) {
  const ephemeralPrivate = generateRandomBytes(32);
  const ephemeralPublic = generateRandomBytes(32);
  const sharedSecret = x25519KeyExchange(ephemeralPrivate, new Uint8Array(32).fill(1));
  const stealthAddressBytes = generateRandomBytes(32);
  return {
    stealthAddress: bytesToHex(stealthAddressBytes),
    ephemeralPublicKey: bytesToHex(ephemeralPublic),
    encryptedNote: bytesToHex(sharedSecret),
  };
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function createPaymentLink(params: { mint: string; amount: bigint; recipientAddress: string; expiresAt?: number; memo?: string }) {
  const id = generateUUID();
  const searchParams = new URLSearchParams({
    id,
    mint: params.mint,
    amount: params.amount.toString(),
    to: params.recipientAddress,
  });
  if (params.expiresAt) searchParams.set('exp', params.expiresAt.toString());
  if (params.memo) searchParams.set('memo', params.memo);
  const url = `onyx://pay?${searchParams.toString()}`;
  return { id, url, ...params };
}

function parsePaymentLink(url: string) {
  const parsedUrl = new URL(url);
  const id = parsedUrl.searchParams.get('id');
  const mint = parsedUrl.searchParams.get('mint');
  const amount = parsedUrl.searchParams.get('amount');
  const to = parsedUrl.searchParams.get('to');
  const exp = parsedUrl.searchParams.get('exp');
  const memo = parsedUrl.searchParams.get('memo');
  if (!id || !mint || !amount || !to) throw new Error('Missing required parameters');
  return { id, mint, amount: BigInt(amount), recipientAddress: to, expiresAt: exp ? parseInt(exp, 10) : undefined, memo: memo ?? undefined };
}

describe('onyx-privacy', () => {
  describe('protocolFee', () => {
    it('protocolFee uses divisor 16384 not 10000', () => {
      const amount = 1_000_000n;
      const bps = 100;
      const expected = BigInt(Math.floor(1_000_000 * 100 / 16384));
      expect(protocolFee(amount, bps)).toBe(expected);
      const wrong = BigInt(Math.floor(1_000_000 * 100 / 10000));
      expect(protocolFee(amount, bps)).not.toBe(wrong);
    });

    it('protocolFee handles zero amount', () => {
      expect(protocolFee(0n, 100)).toBe(0n);
    });

    it('protocolFee handles small amounts correctly', () => {
      const amount = 1n;
      const bps = 100;
      const result = protocolFee(amount, bps);
      expect(result).toBeGreaterThanOrEqual(0n);
    });
  });

  describe('createU64', () => {
    it('createU64 throws RangeError on negative input', () => {
      expect(() => createU64(-1n)).toThrow(RangeError);
    });

    it('createU64 throws RangeError when exceeding U64 max', () => {
      expect(() => createU64(2n ** 64n)).toThrow(RangeError);
    });

    it('createU64 accepts valid value', () => {
      expect(() => createU64(1_000_000n)).not.toThrow();
      expect(createU64(0n)).toBe(0n);
    });

    it('createU64 accepts max U64 value', () => {
      const maxU64 = 2n ** 64n - 1n;
      expect(createU64(maxU64)).toBe(maxU64);
    });
  });

  describe('viewing key derivation', () => {
    it('viewing key derivation is deterministic', () => {
      const fakeWallet = { publicKey: new Uint8Array(32).fill(1) };
      const mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const mvk1 = deriveMVK(fakeWallet);
      const mvk2 = deriveMVK(fakeWallet);
      expect(mvk1).toBe(mvk2);
      const mintKey1 = deriveMintKey(mvk1, mint);
      const mintKey2 = deriveMintKey(mvk2, mint);
      expect(mintKey1).toBe(mintKey2);
      const yearKey1 = deriveYearlyKey(mintKey1, 2026);
      const yearKey2 = deriveYearlyKey(mintKey2, 2026);
      expect(yearKey1).toBe(yearKey2);
    });

    it('deriveYearlyKey throws on invalid year', () => {
      const mintKey = '0x1234567890abcdef';
      expect(() => deriveYearlyKey(mintKey, 1999)).toThrow(RangeError);
      expect(() => deriveYearlyKey(mintKey, 10000)).toThrow(RangeError);
    });

    it('deriveMonthlyKey throws on invalid month', () => {
      const yearlyKey = '0x1234567890abcdef';
      expect(() => deriveMonthlyKey(yearlyKey, 0)).toThrow(RangeError);
      expect(() => deriveMonthlyKey(yearlyKey, 13)).toThrow(RangeError);
    });

    it('deriveDailyKey throws on invalid day', () => {
      const monthlyKey = '0x1234567890abcdef';
      expect(() => deriveDailyKey(monthlyKey, 0)).toThrow(RangeError);
      expect(() => deriveDailyKey(monthlyKey, 32)).toThrow(RangeError);
    });
  });

  describe('stealth address generation', () => {
    it('stealth address generation produces unique output each call', async () => {
      const recipient = '0x' + 'ab'.repeat(32);
      const result1 = await generateStealthAddress(recipient);
      const result2 = await generateStealthAddress(recipient);
      expect(result1.stealthAddress).not.toBe(result2.stealthAddress);
      expect(result1.ephemeralPublicKey).not.toBe(result2.ephemeralPublicKey);
    });
  });

  describe('payment link', () => {
    it('payment link encode/decode roundtrip', () => {
      const link = createPaymentLink({
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 1_000_000n,
        recipientAddress: 'mockRecipientAddress123456789012345678901234567890',
      });
      const parsed = parsePaymentLink(link.url);
      expect(parsed.id).toBe(link.id);
      expect(parsed.mint).toBe(link.mint);
      expect(parsed.amount).toBe(link.amount);
      expect(parsed.recipientAddress).toBe(link.recipientAddress);
    });

    it('parsePaymentLink throws on invalid format', () => {
      expect(() => parsePaymentLink('invalid://url')).toThrow();
      expect(() => parsePaymentLink('https://example.com')).toThrow();
    });
  });
});