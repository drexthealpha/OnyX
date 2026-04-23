import type { Address } from './types.js';

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

export function deriveMVK(wallet: { publicKey: Uint8Array }): string {
  const pubkeyHex = Array.from(wallet.publicKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return poseidonHash('mvk', pubkeyHex);
}

export function deriveMintKey(mvk: string, mint: Address): string {
  return poseidonHash('mint', mvk, mint);
}

export function deriveYearlyKey(mintKey: string, year: number): string {
  if (year < 2000 || year > 9999) {
    throw new RangeError('[onyx-privacy] deriveYearlyKey: year must be between 2000 and 9999');
  }
  return poseidonHash('yearly', mintKey, year);
}

export function deriveMonthlyKey(yearlyKey: string, month: number): string {
  if (month < 1 || month > 12) {
    throw new RangeError('[onyx-privacy] deriveMonthlyKey: month must be between 1 and 12');
  }
  return poseidonHash('monthly', yearlyKey, month);
}

export function deriveDailyKey(monthlyKey: string, day: number): string {
  if (day < 1 || day > 31) {
    throw new RangeError('[onyx-privacy] deriveDailyKey: day must be between 1 and 31');
  }
  return poseidonHash('daily', monthlyKey, day);
}