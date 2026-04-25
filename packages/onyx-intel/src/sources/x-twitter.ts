// packages/onyx-intel/src/sources/x-twitter.ts
// Twitter/X search via API v2 — requires user-provided Bearer token.
// URL: https://api.twitter.com/2/tweets/search/recent?query={query}
// Bearer token: process.env.TWITTER_BEARER_TOKEN (operator cost: $0)
// Returns top 10 tweets by engagement (likes + retweets + replies).

import type { Source } from "../types.ts";

const BASE_URL = "https://api.twitter.com/2/tweets/search/recent";

interface Tweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count?: number;
  };
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TwitterSearchResponse {
  data?: Tweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
  };
}

/**
 * Search recent tweets via Twitter API v2.
 * Returns top 10 tweets sorted by engagement (likes + retweets + replies).
 * Requires TWITTER_BEARER_TOKEN environment variable.
 */
export async function search(query: string): Promise<Source[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    console.warn("[x-twitter] TWITTER_BEARER_TOKEN not set — skipping");
    return [];
  }

  // Build the query — exclude replies and retweets for cleaner results
  const twitterQuery = `${query} -is:retweet -is:reply lang:en`;
  const params = new URLSearchParams({
    query: twitterQuery,
    max_results: "10",
    "tweet.fields": "created_at,public_metrics,author_id",
    "user.fields": "username,name",
    expansions: "author_id",
  });

  const url = `${BASE_URL}?${params.toString()}`;

  let data: TwitterSearchResponse;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn(`[x-twitter] HTTP ${res.status} for query "${query}"`);
      return [];
    }

    data = (await res.json()) as TwitterSearchResponse;
  } catch (err) {
    console.warn(`[x-twitter] fetch error: ${(err as Error).message}`);
    return [];
  }

  const tweets = data?.data ?? [];
  const users = data?.includes?.users ?? [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Sort by total engagement
  const sorted = tweets.sort((a, b) => {
    const engA =
      (a.public_metrics?.like_count ?? 0) +
      (a.public_metrics?.retweet_count ?? 0) +
      (a.public_metrics?.reply_count ?? 0);
    const engB =
      (b.public_metrics?.like_count ?? 0) +
      (b.public_metrics?.retweet_count ?? 0) +
      (b.public_metrics?.reply_count ?? 0);
    return engB - engA;
  });

  return sorted.slice(0, 10).map((tweet): Source => {
    const user = tweet.author_id ? userMap.get(tweet.author_id) : undefined;
    const handle = user ? `@${user.username}` : "unknown";
    const engagement =
      (tweet.public_metrics?.like_count ?? 0) +
      (tweet.public_metrics?.retweet_count ?? 0) +
      (tweet.public_metrics?.reply_count ?? 0);

    return {
      platform: "x-twitter",
      title: `${handle}: ${tweet.text.slice(0, 80)}`,
      url: `https://twitter.com/i/web/status/${tweet.id}`,
      score: 0,
      snippet: tweet.text.slice(0, 280),
      engagement,
      publishedAt: tweet.created_at ? new Date(tweet.created_at).getTime() : undefined,
    };
  });
}