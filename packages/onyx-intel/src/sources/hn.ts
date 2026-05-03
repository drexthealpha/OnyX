// packages/onyx-intel/src/sources/hn.ts
// Hacker News search via Algolia API — no auth required.
// URL: https://hn.algolia.com/api/v1/search?query={query}&tags=story
// Returns top 10 by Algolia relevance score.

import type { Source } from "../types.js";

const BASE_URL = "https://hn.algolia.com/api/v1/search";

interface AlgoliaHit {
  objectID: string;
  title: string;
  url?: string;
  author: string;
  points: number;
  num_comments: number;
  created_at_i: number;
  story_text?: string;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
}

/**
 * Search Hacker News stories via Algolia.
 * Returns top 10 results by relevance score.
 */
export async function search(query: string): Promise<Source[]> {
  const url = `${BASE_URL}?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`;

  let data: AlgoliaResponse;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn(`[hn] HTTP ${res.status} for query "${query}"`);
      return [];
    }

    data = (await res.json()) as AlgoliaResponse;
  } catch (err) {
    console.warn(`[hn] fetch error: ${(err as Error).message}`);
    return [];
  }

  const hits = data?.hits ?? [];

  return hits.slice(0, 10).map((hit): Source => {
    const hnUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
    const snippet = (hit.story_text ?? hit.title).slice(0, 280);

    return {
      platform: "hn",
      title: hit.title ?? "(no title)",
      url: hit.url || hnUrl,
      score: 0,
      snippet,
      engagement: (hit.points ?? 0) + (hit.num_comments ?? 0),
      publishedAt: hit.created_at_i ? hit.created_at_i * 1000 : undefined,
    };
  });
}
