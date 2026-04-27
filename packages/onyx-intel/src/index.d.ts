import type { IntelBrief } from "./types.ts";
export type { IntelBrief, Source } from "./types.ts";
export { runAllSources } from "./pipeline/search.ts";
export { scoreSource } from "./pipeline/score.ts";
export { deduplicateSources } from "./pipeline/dedupe.ts";
export { synthesize } from "./pipeline/synthesize.ts";
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
export declare function runIntel(topic: string): Promise<IntelBrief>;
//# sourceMappingURL=index.d.ts.map