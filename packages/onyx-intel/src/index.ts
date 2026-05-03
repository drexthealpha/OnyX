// packages/onyx-intel/src/index.ts
// Main entry point: runIntel(topic) → Promise<IntelBrief>
// Checks cache first. If miss, runs full pipeline, synthesizes, caches, returns.

import type { IntelBrief } from "./types.js";
import { get as cacheGet, set as cacheSet, listCachedTopics, evictCache } from "./cache.js";
import { runAllSources } from "./pipeline/search.js";
import { synthesize } from "./pipeline/synthesize.js";

export type { IntelBrief, Source } from "./types.js";
export { runAllSources } from "./pipeline/search.js";
export { scoreSource } from "./pipeline/score.js";
export { deduplicateSources } from "./pipeline/dedupe.js";
export { synthesize } from "./pipeline/synthesize.js";
export { listCachedTopics, evictCache };

/**
 * Returns the most recent N briefs from the cache.
 */
export async function getLatestIntel(limit = 10): Promise<IntelBrief[]> {
  const topics = listCachedTopics().slice(0, limit);
  return topics.map((t) => cacheGet(t)).filter(Boolean) as IntelBrief[];
}

/**
 * Placeholder for trending topics. In a real system, this would analyze
 * social signals or frequent cache hits.
 */
export async function getTrendingTopics(): Promise<string[]> {
  return listCachedTopics().slice(0, 5);
}

/**
 * Alias for runIntel to match nerve expectations.
 */
export async function generateBrief(topic: string): Promise<IntelBrief> {
  return runIntel(topic);
}

/**
 * Run the full intelligence pipeline for a topic.
 *
 * 1. Check cache (TTL: 1 hour). Return cached result if fresh.
 * 2. Run all 8 sources in parallel (Promise.allSettled).
 * 3. Deduplicate, score, sort sources.
 * 4. Synthesize top sources into a 200-word brief via Claude.
 * 5. Compute confidence from top-5 source scores.
 * 6. Cache and return IntelBrief.
 */
export async function runIntel(topic: string): Promise<IntelBrief> {
  // 1. Cache check
  const cached = cacheGet(topic);
  if (cached) {
    console.log(`[onyx-intel] cache hit for "${topic}"`);
    return cached;
  }

  console.log(`[onyx-intel] running pipeline for "${topic}"`);

  // 2. Fetch and process all sources
  const sources = await runAllSources(topic);

  // 3. Synthesize brief (top 12 sources sent to Claude)
  let brief: string;
  try {
    brief = await synthesize(sources, topic);
  } catch (err) {
    // Degrade gracefully — return a simple list if synthesis fails
    console.warn(`[onyx-intel] synthesis failed: ${(err as Error).message}`);
    brief = `[Synthesis unavailable] Top sources for "${topic}":\n` +
      sources
        .slice(0, 5)
        .map((s, i) => `[${i + 1}] ${s.title} (${s.platform})`)
        .join("\n");
  }

  // 4. Confidence = average score of top-5 sources
  const top5 = sources.slice(0, 5);
  const confidence =
    top5.length > 0
      ? top5.reduce((sum, s) => sum + s.score, 0) / top5.length
      : 0;

  const result: IntelBrief = {
    topic,
    brief,
    sources,
    timestamp: Date.now(),
    confidence: Math.round(confidence * 100) / 100,
  };

  // 5. Cache result
  try {
    cacheSet(topic, result);
  } catch (err) {
    console.warn(`[onyx-intel] cache write failed: ${(err as Error).message}`);
  }

  return result;
}
