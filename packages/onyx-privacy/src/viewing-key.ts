import {
  getMasterViewingKeyDeriver,
  getMintViewingKeyDeriver,
  getYearlyViewingKeyDeriver,
  getMonthlyViewingKeyDeriver,
  getDailyViewingKeyDeriver,
} from '@umbra-privacy/sdk';
import type { Address } from '@solana/kit';
import type { Year, Month, Day } from '@umbra-privacy/sdk/types';
import type { UmbraClient } from './client.js';

export async function deriveMVK(client: UmbraClient): Promise<bigint> {
  const deriver = getMasterViewingKeyDeriver({ client });
  return deriver();
}

export async function deriveMintKey(client: UmbraClient, mint: Address): Promise<bigint> {
  const deriver = getMintViewingKeyDeriver({ client });
  return deriver(mint);
}

export async function deriveYearlyKey(client: UmbraClient, mint: Address, year: number): Promise<bigint> {
  const deriver = getYearlyViewingKeyDeriver({ client });
  return deriver(mint, year as Year);
}

export async function deriveMonthlyKey(client: UmbraClient, mint: Address, year: number, month: number): Promise<bigint> {
  const deriver = getMonthlyViewingKeyDeriver({ client });
  return deriver(mint, year as Year, month as Month);
}

export async function deriveDailyKey(client: UmbraClient, mint: Address, year: number, month: number, day: number): Promise<bigint> {
  const deriver = getDailyViewingKeyDeriver({ client });
  return deriver(mint, year as Year, month as Month, day as Day);
}