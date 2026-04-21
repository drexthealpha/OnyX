/**
 * Collection: onyx_research
 * Stores research artefacts — summaries, citations, findings.
 *
 * Vector size: 384 (all-MiniLM-L6-v2)
 */

import {
  createCollectionIfNotExists,
  upsert as rawUpsert,
  deletePoints,
  getPoint,
} from '../client.js';
import { embed } from '../embed.js';
import { search as rawSearch, type SearchResult } from '../search.js';

const COLLECTION = 'onyx_research';
const VECTOR_SIZE = 384;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResearchPoint {
  id: string;
  text: string;
  payload: {
    timestamp: number;
    query: string;
    source: string;
    confidence?: number;
    citations?: string[];
    [key: string]: unknown;
  };
}

export interface ResearchResult extends SearchResult {
  payload: ResearchPoint['payload'];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await createCollectionIfNotExists(COLLECTION, VECTOR_SIZE);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function upsert(points: ResearchPoint[]): Promise<void> {
  await init();
  const embedded = await Promise.all(
    points.map(async (p) => ({
      id: p.id,
      vector: Array.from(await embed(p.text)),
      payload: { ...p.payload, text: p.text },
    })),
  );
  await rawUpsert(COLLECTION, embedded);
}

async function searchResearch(
  query: string,
  topK = 5,
): Promise<ResearchResult[]> {
  await init();
  const results = await rawSearch(query, COLLECTION, topK);
  return results as ResearchResult[];
}

async function deleteResearch(ids: string[]): Promise<void> {
  await deletePoints(COLLECTION, ids);
}

async function get(id: string): Promise<ResearchPoint['payload'] | null> {
  const payload = await getPoint(COLLECTION, id);
  return payload as ResearchPoint['payload'] | null;
}

export const research = { upsert, search: searchResearch, delete: deleteResearch, get };