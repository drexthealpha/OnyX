import type { Source } from "../types.ts";
/**
 * Search GitHub repositories by query.
 * Sorted by stars descending, top 10.
 * Uses GITHUB_TOKEN env var if present for higher rate limits.
 */
export declare function search(query: string): Promise<Source[]>;
//# sourceMappingURL=github.d.ts.map