// ============================================================
// packages/onyx-seo/src/data/dataforseo.ts
// DataForSEO API integration for keyword metrics and SERP data
// DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD — user-provided, operator cost: $0
// Base64 auth: btoa(login + ':' + password)
// ============================================================

import type { KeywordMetric, SERPResult } from "../types.js";

const BASE_URL = "https://api.dataforseo.com/v3";

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error(
      "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set in environment"
    );
  }
  return "Basic " + btoa(`${login}:${password}`);
}

async function dataforSEOPost<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const auth = getAuthHeader();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DataForSEO error ${res.status}: ${err}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetches keyword volume, CPC, competition from DataForSEO
 * Keywords Data API → Google → Search Volume
 */
export async function getKeywordMetrics(
  keywords: string[]
): Promise<KeywordMetric[]> {
  const body = [
    {
      keywords,
      location_code: 2840,
      language_code: "en",
    },
  ];

  type DFSResponse = {
    tasks?: Array<{
      result?: Array<{
        keyword: string;
        keyword_info?: {
          search_volume: number;
          cpc: number;
          competition: number;
          trend?: string;
        };
      }>;
    }>;
  };

  const data = await dataforSEOPost<DFSResponse>(
    "/keywords_data/google_ads/search_volume/live",
    body
  );

  const results: KeywordMetric[] = [];
  const taskResults = data.tasks?.[0]?.result ?? [];

  for (const item of taskResults) {
    results.push({
      keyword: item.keyword,
      searchVolume: item.keyword_info?.search_volume ?? 0,
      cpc: item.keyword_info?.cpc ?? 0,
      competition: item.keyword_info?.competition ?? 0,
      trend: item.keyword_info?.trend ?? "stable",
    });
  }

  return results;
}

/**
 * Fetches SERP results for a keyword from DataForSEO
 * SERP API → Google → Organic Results
 */
export async function getSERPResults(
  keyword: string
): Promise<SERPResult[]> {
  const body = [
    {
      keyword,
      location_code: 2840,
      language_code: "en",
      device: "desktop",
      os: "windows",
      depth: 10,
    },
  ];

  type SERPResponse = {
    tasks?: Array<{
      result?: Array<{
        items?: Array<{
          rank_group: number;
          url: string;
          title: string;
          description: string;
          domain: string;
        }>;
      }>;
    }>;
  };

  const data = await dataforSEOPost<SERPResponse>(
    "/serp/google/organic/live/advanced",
    body
  );

  const results: SERPResult[] = [];
  const items = data.tasks?.[0]?.result?.[0]?.items ?? [];

  for (const item of items) {
    if (item.url) {
      results.push({
        rank: item.rank_group,
        url: item.url,
        title: item.title ?? "",
        description: item.description ?? "",
        domain: item.domain ?? "",
      });
    }
  }

  return results;
}