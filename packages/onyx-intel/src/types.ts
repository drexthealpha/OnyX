// packages/onyx-intel/src/types.ts

export interface Source {
  platform: string;       // "reddit" | "hn" | "github" | "polymarket" | "x-twitter" | "youtube" | "bluesky" | "web"
  title: string;
  url: string;
  score: number;          // Final computed score [0-1]
  snippet: string;        // ≤280 chars
  engagement?: number;    // Raw engagement count (upvotes, likes, stars, etc.)
  publishedAt?: number;   // Unix timestamp in ms (for recency decay)
}

export interface IntelBrief {
  topic: string;
  brief: string;          // AI-synthesized intelligence brief, max 200 words, inline [N] citations
  sources: Source[];
  timestamp: number;      // Unix ms when brief was generated
  confidence: number;     // [0-1] average score of top-5 sources
}

export interface CacheRow {
  topic: string;
  brief_json: string;
  created_at: number;     // Unix ms
}
