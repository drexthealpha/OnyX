// packages/onyx-intel/src/sources/youtube.ts
// YouTube search via Data API v3 + transcript extraction.
// URL: https://www.googleapis.com/youtube/v3/search
// API key: process.env.YOUTUBE_API_KEY (operator cost: $0)
// Returns top 5 videos with transcripts via youtube-transcript package.

import type { Source } from "../types.ts";

const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

interface YTSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    description: string;
  };
}

interface YTSearchResponse {
  items?: YTSearchItem[];
}

interface YTVideoStats {
  id: string;
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

interface YTVideosResponse {
  items?: YTVideoStats[];
}

/**
 * Search YouTube for videos matching the query, fetch transcripts.
 * Returns top 5 videos.
 * Requires YOUTUBE_API_KEY environment variable.
 */
export async function search(query: string): Promise<Source[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[youtube] YOUTUBE_API_KEY not set — skipping");
    return [];
  }

  // Step 1: Search for videos
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "5",
    order: "relevance",
    videoCaption: "closedCaption", // Only captioned videos (needed for transcripts)
    key: apiKey,
  });

  let searchData: YTSearchResponse;
  try {
    const res = await fetch(`${SEARCH_URL}?${searchParams.toString()}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[youtube] search HTTP ${res.status}`);
      return [];
    }
    searchData = (await res.json()) as YTSearchResponse;
  } catch (err) {
    console.warn(`[youtube] search error: ${(err as Error).message}`);
    return [];
  }

  const items = searchData?.items ?? [];
  if (items.length === 0) return [];

  const videoIds = items.map((i) => i.id.videoId).filter(Boolean);

  // Step 2: Fetch view/like stats
  const statsMap = new Map<string, YTVideoStats["statistics"]>();
  try {
    const statsParams = new URLSearchParams({
      part: "statistics",
      id: videoIds.join(","),
      key: apiKey,
    });
    const statsRes = await fetch(`${VIDEOS_URL}?${statsParams.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (statsRes.ok) {
      const statsData = (await statsRes.json()) as YTVideosResponse;
      for (const v of statsData?.items ?? []) {
        statsMap.set(v.id, v.statistics);
      }
    }
  } catch {
    // stats optional — proceed without
  }

  // Step 3: Fetch transcripts in parallel (best-effort)
  const transcripts = new Map<string, string>();
  const { YoutubeTranscript } = await import("youtube-transcript");

  await Promise.allSettled(
    videoIds.map(async (vid) => {
      try {
        const entries = await YoutubeTranscript.fetchTranscript(vid);
        const text = entries
          .map((e) => e.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 600); // First 600 chars of transcript
        transcripts.set(vid, text);
      } catch {
        // transcript not available — use description fallback
      }
    })
  );

  return items.map((item): Source => {
    const vid = item.id.videoId;
    const stats = statsMap.get(vid);
    const views = parseInt(stats?.viewCount ?? "0", 10);
    const likes = parseInt(stats?.likeCount ?? "0", 10);
    const engagement = views + likes;

    const transcript = transcripts.get(vid);
    const snippet = transcript
      ? transcript.slice(0, 280)
      : item.snippet.description.slice(0, 280);

    return {
      platform: "youtube",
      title: `${item.snippet.title} — ${item.snippet.channelTitle}`,
      url: `https://www.youtube.com/watch?v=${vid}`,
      score: 0,
      snippet,
      engagement,
      publishedAt: item.snippet.publishedAt
        ? new Date(item.snippet.publishedAt).getTime()
        : undefined,
    };
  });
}