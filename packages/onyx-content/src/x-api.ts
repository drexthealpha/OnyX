/**
 * x-api.ts — Twitter API v2 client primitives
 * Handles OAuth 2.0 Bearer Token for read operations
 * and OAuth 1.0a for write operations (tweets).
 */

const TWITTER_API_BASE = 'https://api.twitter.com/2';

export interface TweetData {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
}

export interface SearchResponse {
  data: TweetData[];
  meta: {
    newest_id?: string;
    oldest_id?: string;
    result_count: number;
    next_token?: string;
  };
}

export async function searchTweets(
  query: string,
  maxResults = 10,
): Promise<TweetData[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) throw new Error('TWITTER_BEARER_TOKEN not set');

  const params = new URLSearchParams({
    query,
    max_results: Math.min(maxResults, 100).toString(),
    'tweet.fields': 'created_at,author_id',
  });

  const res = await fetch(`${TWITTER_API_BASE}/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!res.ok) throw new Error(`Twitter search error ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as SearchResponse;
  return data.data ?? [];
}

export async function getTweet(tweetId: string): Promise<TweetData | null> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) throw new Error('TWITTER_BEARER_TOKEN not set');

  const res = await fetch(
    `${TWITTER_API_BASE}/tweets/${tweetId}?tweet.fields=created_at,author_id`,
    { headers: { Authorization: `Bearer ${bearerToken}` } },
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Twitter get tweet error ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as { data: TweetData };
  return data.data;
}

export async function getUserByUsername(username: string): Promise<{ id: string; name: string; username: string } | null> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) throw new Error('TWITTER_BEARER_TOKEN not set');

  const res = await fetch(`${TWITTER_API_BASE}/users/by/username/${username}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Twitter user lookup error ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as { data: { id: string; name: string; username: string } };
  return data.data;
}