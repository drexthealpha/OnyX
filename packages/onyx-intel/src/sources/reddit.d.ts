import type { Source } from "../types.ts";
/**
 * Search Reddit for the given query.
 * Returns top 10 posts sorted by relevance.
 * No authentication required — uses public JSON endpoint.
 */
export declare function search(query: string): Promise<Source[]>;
//# sourceMappingURL=reddit.d.ts.map