// packages/onyx-intel/src/sources/bluesky.ts
// Bluesky post search via AT Protocol public API — no auth required.
// URL: https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q={query}
// No auth required for public posts.

import type { Source } from "../types.js";

const BASE_URL = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts";

interface BskyPostView {
  uri: string;
  cid: string;
  author: {
    handle: string;
    displayName?: string;
  };
  record: {
    text: string;
    createdAt: string;
  };
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  indexedAt: string;
}

interface BskySearchResponse {
  posts?: BskyPostView[];
  cursor?: string;
}

/**
 * Search Bluesky public posts via AT Protocol.
 * Returns top 10 posts sorted by engagement.
 */
export async function search(query: string): Promise<Source[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "25", // Fetch more, sort by engagement, return top 10
    sort: "top",
  });

  const url = `${BASE_URL}?${params.toString()}`;

  let data: BskySearchResponse;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn(`[bluesky] HTTP ${res.status} for query "${query}"`);
      return [];
    }

    data = (await res.json()) as BskySearchResponse;
  } catch (err) {
    console.warn(`[bluesky] fetch error: ${(err as Error).message}`);
    return [];
  }

  const posts = data?.posts ?? [];

  // Sort by combined engagement
  const sorted = posts.sort((a, b) => {
    const engA = (a.likeCount ?? 0) + (a.repostCount ?? 0) + (a.replyCount ?? 0);
    const engB = (b.likeCount ?? 0) + (b.repostCount ?? 0) + (b.replyCount ?? 0);
    return engB - engA;
  });

  return sorted.slice(0, 10).map((post): Source => {
    const handle = post.author.handle;
    const text = post.record?.text ?? "";
    // Convert AT Protocol URI to a bsky.app URL
    // at://did:plc:xxx/app.bsky.feed.post/yyy → bsky.app/profile/handle/post/yyy
    const rkey = post.uri.split("/").pop() ?? "";
    const bskyUrl = `https://bsky.app/profile/${handle}/post/${rkey}`;
    const engagement =
      (post.likeCount ?? 0) + (post.repostCount ?? 0) + (post.replyCount ?? 0);

    return {
      platform: "bluesky",
      title: `@${handle}: ${text.slice(0, 80)}`,
      url: bskyUrl,
      score: 0,
      snippet: text.slice(0, 280),
      engagement,
      publishedAt: post.record?.createdAt
        ? new Date(post.record.createdAt).getTime()
        : undefined,
    };
  });
}
