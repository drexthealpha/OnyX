/**
 * Collection: onyx_memories
 * Stores agent episodic memories — what happened, when, and why it matters.
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

const COLLECTION = 'onyx_memories';
const VECTOR_SIZE = 384;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemoryPoint {
  id: string;
  text: string;
  payload: {
    timestamp: number;
    source: string;
    importance?: number;
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface MemoryResult extends SearchResult {
  payload: MemoryPoint['payload'];
}

// ─── Initialise ───────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await createCollectionIfNotExists(COLLECTION, VECTOR_SIZE);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function upsert(points: MemoryPoint[]): Promise<void> {
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

async function searchMemories(
  query: string,
  topK = 5,
): Promise<MemoryResult[]> {
  await init();
  const results = await rawSearch(query, COLLECTION, topK);
  return results as MemoryResult[];
}

async function deleteMemories(ids: string[]): Promise<void> {
  await deletePoints(COLLECTION, ids);
}

async function get(id: string): Promise<MemoryPoint['payload'] | null> {
  const payload = await getPoint(COLLECTION, id);
  return payload as MemoryPoint['payload'] | null;
}

export const memories = { upsert, search: searchMemories, delete: deleteMemories, get };