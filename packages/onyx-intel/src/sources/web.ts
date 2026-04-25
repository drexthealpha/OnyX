// packages/onyx-intel/src/sources/web.ts
// Open web search via @onyx/browser google-search macro.
// @onyx/browser is S22 (not yet built) — import dynamically with try/catch fallback.
// Falls back to empty array if @onyx/browser is unavailable.

import type { Source } from "../types.ts";

interface WebResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: number;
}

/**
 * Search the open web via @onyx/browser google-search macro.
 * If @onyx/browser is not installed (S22 not yet built), returns empty array.
 */
export async function search(query: string): Promise<Source[]> {
  let googleSearch: ((query: string, limit?: number) => Promise<WebResult[]>) | null = null;

  try {
    // Dynamic import — @onyx/browser is S22, may not be installed yet
    const browser = await import("@onyx/browser");
    googleSearch = browser.macros?.googleSearch ?? browser.googleSearch ?? null;
  } catch {
    // @onyx/browser not available — skip silently
    console.warn("[web] @onyx/browser not installed (S22 pending) — skipping web source");
    return [];
  }

  if (!googleSearch) {
    console.warn("[web] googleSearch macro not found in @onyx/browser");
    return [];
  }

  let results: WebResult[];
  try {
    results = await googleSearch(query, 10);
  } catch (err) {
    console.warn(`[web] googleSearch error: ${(err as Error).message}`);
    return [];
  }

  return results.slice(0, 10).map((result): Source => ({
    platform: "web",
    title: result.title,
    url: result.url,
    score: 0,
    snippet: result.snippet.slice(0, 280),
    engagement: 0, // no engagement signal from web results
    publishedAt: result.publishedAt,
  }));
}