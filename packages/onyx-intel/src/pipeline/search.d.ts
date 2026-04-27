import type { Source } from "../types.ts";
/**
 * Run all 8 sources in parallel.
 * Failed sources are logged and skipped — no single failure blocks the pipeline.
 * Returns merged, deduplicated, scored array sorted by score descending.
 */
export declare function runAllSources(topic: string): Promise<Source[]>;
//# sourceMappingURL=search.d.ts.map