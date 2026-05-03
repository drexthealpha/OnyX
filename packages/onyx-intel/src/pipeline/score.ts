// packages/onyx-intel/src/pipeline/score.ts
// Scoring formula for individual sources.
// final = keywordMatch*0.3 + authorityWeight*0.2 + engagementNorm*0.2 + recencyDecay*0.3

import type { Source } from "../types.js";

// Authority weights per platform [0-1]
const PLATFORM_WEIGHTS: Record<string, number> = {
  reddit: 0.7,
  hn: 0.8,
  github: 0.9,
  polymarket: 0.85,
  "x-twitter": 0.75,
  youtube: 0.8,
  bluesky: 0.65,
  web: 0.7,
};

/**
 * Count how many query words appear in the snippet (case-insensitive).
 */
function countMatches(snippet: string, queryWords: string[]): number {
  if (!snippet || queryWords.length === 0) return 0;
  const lower = snippet.toLowerCase();
  return queryWords.filter((w) => lower.includes(w.toLowerCase())).length;
}

/**
 * Score a single source against a query.
 *
 * Formula:
 *   keywordMatch  = countMatches(snippet, queryWords) / queryWords.length     [0-1]
 *   authorityWeight = platformWeights[platform]                               [0-1]
 *   engagementNorm  = Math.min(engagement / 1000, 1)                          [0-1]
 *   recencyDecay    = 1 / Math.log(ageHours + Math.E)                         [0-1]
 *   final = keywordMatch*0.3 + authorityWeight*0.2 + engagementNorm*0.2 + recencyDecay*0.3
 */
export function scoreSource(source: Source, query: string): number {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // 1. Keyword match component [0-1]
  const keywordMatch =
    queryWords.length > 0
      ? countMatches(source.snippet, queryWords) / queryWords.length
      : 0;

  // 2. Authority weight per platform [0-1]
  const authorityWeight = PLATFORM_WEIGHTS[source.platform] ?? 0.5;

  // 3. Engagement normalized [0-1]
  const engagementNorm = Math.min((source.engagement ?? 0) / 1000, 1);

  // 4. Recency decay [0-1] — newer = higher score
  // ageHours = 0 → 1/ln(e) = 1.0 (max)
  // ageHours = 24 → 1/ln(24+e) ≈ 0.35
  // ageHours = 100 → 1/ln(100+e) ≈ 0.22
  const now = Date.now();
  const ageHours = source.publishedAt
    ? (now - source.publishedAt) / (1000 * 60 * 60)
    : 24 * 7; // Default: treat unknown age as 1 week old

  const recencyDecay = 1 / Math.log(ageHours + Math.E);

  // Final weighted score
  const final =
    keywordMatch * 0.3 +
    authorityWeight * 0.2 +
    engagementNorm * 0.2 +
    recencyDecay * 0.3;

  // Clamp to [0, 1]
  return Math.min(1, Math.max(0, final));
}

/**
 * Score all sources in-place and return sorted array (highest score first).
 */
export function scoreAndSort(sources: Source[], query: string): Source[] {
  return sources
    .map((s) => ({ ...s, score: scoreSource(s, query) }))
    .sort((a, b) => b.score - a.score);
}
