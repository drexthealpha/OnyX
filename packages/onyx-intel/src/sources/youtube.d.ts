import type { Source } from "../types.ts";
/**
 * Search YouTube for videos matching the query, fetch transcripts.
 * Returns top 5 videos.
 * Requires YOUTUBE_API_KEY environment variable.
 */
export declare function search(query: string): Promise<Source[]>;
//# sourceMappingURL=youtube.d.ts.map