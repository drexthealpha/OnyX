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

import { getQdrant } from './client.js';
import { embed } from './embed.js';

export interface SearchResult {
  id: string;
  score: number;
  rawScore: number;
  payload: unknown;
}

function decayMultiplier(payload: unknown): number {
  const p = payload as Record<string, unknown> | null;
  const timestamp = p?.['timestamp'];
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return 1 / Math.log(Math.E);
  }
  const ageHours = (Date.now() - timestamp) / 3_600_000;
  const clampedAge = Math.max(0, ageHours);
  return 1 / Math.log(clampedAge + Math.E);
}

/**
 * Semantic search with recency decay.
 *
 * @param query   Natural language query string
 * @param collection  Qdrant collection name
 * @param topK    Maximum number of results to return
 * @returns       Up to topK results sorted by decayed score (highest first)
 */
export async function search(
  query: string,
  collection: string,
  topK: number,
): Promise<SearchResult[]> {
  const vector = await embed(query);
  const client = getQdrant();

  const fetchK = Math.max(topK * 3, topK + 10);

  const hits = await client.search(collection, {
    vector: Array.from(vector),
    limit: fetchK,
    with_payload: true,
  });

  const decayed: SearchResult[] = hits.map((hit) => {
    const rawScore = hit.score;
    const multiplier = decayMultiplier(hit.payload);
    return {
      id: String(hit.id),
      score: rawScore * multiplier,
      rawScore,
      payload: hit.payload,
    };
  });

  decayed.sort((a, b) => b.score - a.score);
  return decayed.slice(0, topK);
}