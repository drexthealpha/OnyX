/**
 * CoinGecko global market data — free public API (no key needed)
 * Rate limit: 10-30 calls/min on free tier
 * Docs: https://docs.coingecko.com/reference/introduction
 */

import axios from 'axios';

const BASE = 'https://api.coingecko.com/api/v3';

export interface GlobalMarketData {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChangePercent24h: number;
  activeCryptocurrencies: number;
  fearGreedIndex?: number;
}

export async function fetchGlobalMarketData(): Promise<GlobalMarketData> {
  const res = await axios.get(`${BASE}/global`);
  const d = res.data?.data ?? {};
  return {
    totalMarketCapUsd: d.total_market_cap?.usd ?? 0,
    totalVolumeUsd: d.total_volume?.usd ?? 0,
    btcDominance: d.market_cap_percentage?.btc ?? 0,
    ethDominance: d.market_cap_percentage?.eth ?? 0,
    marketCapChangePercent24h: d.market_cap_change_percentage_24h_usd ?? 0,
    activeCryptocurrencies: d.active_cryptocurrencies ?? 0,
  };
}

export interface CoinPrice {
  id: string;
  usd: number;
  usd_24h_change: number;
  usd_24h_vol: number;
  usd_market_cap: number;
}

export async function fetchCoinPrice(coinIds: string[]): Promise<CoinPrice[]> {
  const ids = coinIds.join(',');
  const res = await axios.get(`${BASE}/simple/price`, {
    params: {
      ids,
      vs_currencies: 'usd',
      include_24hr_change: true,
      include_24hr_vol: true,
      include_market_cap: true,
    },
  });

  return coinIds.map(id => {
    const d = res.data?.[id] ?? {};
    return {
      id,
      usd: d.usd ?? 0,
      usd_24h_change: d.usd_24h_change ?? 0,
      usd_24h_vol: d.usd_24h_vol ?? 0,
      usd_market_cap: d.usd_market_cap ?? 0,
    };
  });
}

export async function fetchTrendingCoins(): Promise<Array<{ id: string; name: string; symbol: string; rank: number }>> {
  const res = await axios.get(`${BASE}/search/trending`);
  const coins: Array<{ item: { id: string; name: string; symbol: string; market_cap_rank: number } }> =
    res.data?.coins ?? [];
  return coins.map(c => ({
    id: c.item.id,
    name: c.item.name,
    symbol: c.item.symbol,
    rank: c.item.market_cap_rank,
  }));
}