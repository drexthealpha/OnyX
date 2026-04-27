import type { Source } from "../types.ts";
/**
 * Search recent tweets via Twitter API v2.
 * Returns top 10 tweets sorted by engagement (likes + retweets + replies).
 * Requires TWITTER_BEARER_TOKEN environment variable.
 */
export declare function search(query: string): Promise<Source[]>;
//# sourceMappingURL=x-twitter.d.ts.map