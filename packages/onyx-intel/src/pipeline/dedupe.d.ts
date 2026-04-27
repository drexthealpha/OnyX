import type { Source } from "../types.ts";
/**
 * Deduplicate sources:
 * 1. Remove exact URL duplicates (keep first occurrence).
 * 2. Remove near-duplicates where snippet Jaccard similarity > 0.8.
 */
export declare function deduplicateSources(sources: Source[]): Source[];
//# sourceMappingURL=dedupe.d.ts.map