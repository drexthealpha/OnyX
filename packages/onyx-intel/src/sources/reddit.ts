// packages/onyx-intel/src/sources/reddit.ts
// Reddit search via public JSON endpoint — no auth required.
// URL: https://www.reddit.com/search.json?q={query}&sort=relevance&limit=10

import type { Source } from "../types.js";

const BASE_URL = "https://www.reddit.com/search.json";

interface RedditPost {
  title: string;
  url: string;
  permalink: string;
  selftext: string;
  score: number;
  subreddit: string;
  created_utc: number;
  num_comments: number;
}

interface RedditListing {
  data: {
    children: Array<{ data: RedditPost }>;
  };
}

/**
 * Search Reddit for the given query.
 * Returns top 10 posts sorted by relevance.
 * No authentication required — uses public JSON endpoint.
 */
export async function search(query: string): Promise<Source[]> {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&sort=relevance&limit=10`;

  let data: RedditListing;
  try {
    const res = await fetch(url, {
      headers: {
        // Reddit requires a non-default User-Agent to avoid 429s
        "User-Agent": "onyx-intel/0.1.0 (github.com/onyx-os/onyx; research bot)",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn(`[reddit] HTTP ${res.status} for query "${query}"`);
      return [];
    }

    data = (await res.json()) as RedditListing;
  } catch (err) {
    console.warn(`[reddit] fetch error: ${(err as Error).message}`);
    return [];
  }

  const posts = data?.data?.children ?? [];

  return posts.map((child): Source => {
    const post = child.data;
    // Use Reddit permalink as canonical URL for the discussion
    const discussionUrl = `https://www.reddit.com${post.permalink}`;
    const snippet =
      post.selftext?.trim().slice(0, 280) ||
      post.title.slice(0, 280);

    return {
      platform: "reddit",
      title: post.title,
      url: discussionUrl,
      score: 0, // scored later by pipeline/score.ts
      snippet,
      engagement: (post.score ?? 0) + (post.num_comments ?? 0),
      publishedAt: post.created_utc ? post.created_utc * 1000 : undefined,
    };
  });
}
