/**
 * Vector search with recency decay scoring.
 *
 * finalScore = qdrantScore * (1 / Math.log(ageHours + Math.E))
 *
 * where ageHours = (Date.now() - payload.timestamp) / 3_600_000
 *
 * This gives:
 *   - content from 0 h ago  → multiplier ≈ 1 / log(e)  = 1.000
 *   - content from 1 h ago  → multiplier ≈ 1 / log(1+e) ≈ 0.731
 *   - content from 24 h ago → multiplier ≈ 1 / log(24+e) ≈ 0.374
 *   - content from 100 h ago→ multiplier ≈ 1 / log(100+e) ≈ 0.217
 *
 * Results are re-sorted by finalScore descending after decay is applied.
 */
export interface SearchResult {
    id: string;
    score: number;
    rawScore: number;
    payload: unknown;
}
/**
 * Semantic search with recency decay.
 *
 * @param query   Natural language query string
 * @param collection  Qdrant collection name
 * @param topK    Maximum number of results to return
 * @returns       Up to topK results sorted by decayed score (highest first)
 */
export declare function search(query: string, collection: string, topK: number): Promise<SearchResult[]>;
//# sourceMappingURL=search.d.ts.map