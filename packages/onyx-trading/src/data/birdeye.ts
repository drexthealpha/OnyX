/**
 * Birdeye OHLCV + market data
 * API key: user's BIRDEYE_API_KEY env var (operator cost $0)
 * Docs: https://docs.birdeye.so/reference/get_defi-ohlcv
 */

import axios from 'axios';
import { OHLCV } from '../types.js';

const BASE = 'https://public-api.birdeye.so';

function getApiKey(): string {
  const key = process.env['BIRDEYE_API_KEY'];
  if (!key) throw new Error('BIRDEYE_API_KEY env var not set');
  return key;
}

function headers(): Record<string, string> {
  return {
    'X-API-KEY': getApiKey(),
    'x-chain': 'solana',
    'accept': 'application/json',
  };
}

export interface BirdeyeOHLCVParams {
  address: string;      // token mint address
  type: '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '6H' | '8H' | '12H' | '1D' | '3D' | '1W' | '1M';
  timeFrom?: number;    // unix seconds
  timeTo?: number;      // unix seconds
  limit?: number;       // max 1000
}

export async function fetchOHLCV(params: BirdeyeOHLCVParams): Promise<OHLCV[]> {
  const { address, type, timeFrom, timeTo, limit = 200 } = params;
  const timeTo_ = timeTo ?? Math.floor(Date.now() / 1000);
  const timeFrom_ = timeFrom ?? timeTo_ - 86400 * 7; // 7 days default

  const res = await axios.get(`${BASE}/defi/ohlcv`, {
    headers: headers(),
    params: {
      address,
      type,
      time_from: timeFrom_,
      time_to: timeTo_,
    },
  });

  const items: Array<{
    o: number; h: number; l: number; c: number; v: number; unixTime: number;
  }> = res.data?.data?.items ?? [];

  const candles: OHLCV[] = items.slice(0, limit).map(item => ({
    timestamp: item.unixTime * 1000,
    open: item.o,
    high: item.h,
    low: item.l,
    close: item.c,
    volume: item.v,
  }));

  candles.sort((a, b) => a.timestamp - b.timestamp);
  return candles;
}

export async function fetchPrice(address: string): Promise<number> {
  const res = await axios.get(`${BASE}/defi/price`, {
    headers: headers(),
    params: { address },
  });
  return res.data?.data?.value ?? 0;
}

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
}

export async function fetchTokenOverview(address: string): Promise<TokenOverview> {
  const res = await axios.get(`${BASE}/defi/token_overview`, {
    headers: headers(),
    params: { address },
  });
  const d = res.data?.data ?? {};
  return {
    address,
    symbol: d.symbol ?? '',
    name: d.name ?? '',
    decimals: d.decimals ?? 9,
    price: d.price ?? 0,
    priceChange24h: d.priceChange24hPercent ?? 0,
    volume24h: d.v24hUSD ?? 0,
    marketCap: d.mc ?? 0,
    liquidity: d.liquidity ?? 0,
    holders: d.holder ?? 0,
  };
}