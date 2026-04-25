// packages/onyx-intel/src/sources/polymarket.ts
// Polymarket prediction market search via Gamma API — no auth required.
// URL: https://gamma-api.polymarket.com/markets?search={query}&limit=5
// Returns markets with probability and volume.

import type { Source } from "../types.ts";

const BASE_URL = "https://gamma-api.polymarket.com/markets";

interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug?: string;
  outcomePrices?: string;   // JSON string of array e.g. "[\"0.74\",\"0.26\"]"
  outcomes?: string;        // JSON string of array e.g. "[\"Yes\",\"No\"]"
  volume?: number | string;
  liquidity?: number | string;
  endDate?: string;
  active?: boolean;
}

/**
 * Search Polymarket for prediction markets matching the query.
 * Returns top 5 markets with probability odds and volume context.
 */
export async function search(query: string): Promise<Source[]> {
  const url = `${BASE_URL}?search=${encodeURIComponent(query)}&limit=5`;

  let markets: PolymarketMarket[];
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn(`[polymarket] HTTP ${res.status} for query "${query}"`);
      return [];
    }

    markets = (await res.json()) as PolymarketMarket[];
  } catch (err) {
    console.warn(`[polymarket] fetch error: ${(err as Error).message}`);
    return [];
  }

  if (!Array.isArray(markets)) return [];

  return markets.slice(0, 5).map((market): Source => {
    // Parse outcome prices to get Yes probability
    let probStr = "";
    try {
      if (market.outcomePrices) {
        const prices: string[] = JSON.parse(market.outcomePrices);
        const outcomes: string[] = market.outcomes
          ? JSON.parse(market.outcomes)
          : ["Yes", "No"];
        const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
        const prob = parseFloat(prices[yesIdx >= 0 ? yesIdx : 0] ?? "0");
        probStr = `Yes: ${Math.round(prob * 100)}%`;
      }
    } catch {
      probStr = "";
    }

    const volume = parseFloat(String(market.volume ?? 0));
    const snippet = [
      probStr,
      volume > 0 ? `Vol: $${Math.round(volume).toLocaleString()}` : "",
      market.endDate ? `Closes: ${market.endDate.slice(0, 10)}` : "",
    ]
      .filter(Boolean)
      .join(" | ")
      .slice(0, 280);

    const marketUrl = market.slug
      ? `https://polymarket.com/event/${market.slug}`
      : `https://polymarket.com/markets/${market.id}`;

    return {
      platform: "polymarket",
      title: market.question,
      url: marketUrl,
      score: 0,
      snippet: snippet || market.question.slice(0, 280),
      engagement: volume > 0 ? Math.round(volume) : 0,
      publishedAt: market.endDate ? new Date(market.endDate).getTime() : undefined,
    };
  });
}