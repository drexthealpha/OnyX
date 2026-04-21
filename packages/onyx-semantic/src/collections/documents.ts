/**
 * Collection: onyx_documents
 * Stores ingested documents — PDFs, web pages, pastes, files.
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

const COLLECTION = 'onyx_documents';
const VECTOR_SIZE = 384;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentPoint {
  id: string;
  text: string;
  payload: {
    timestamp: number;
    title: string;
    url?: string;
    mimeType?: string;
    chunkIndex?: number;
    totalChunks?: number;
    [key: string]: unknown;
  };
}

export interface DocumentResult extends SearchResult {
  payload: DocumentPoint['payload'];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await createCollectionIfNotExists(COLLECTION, VECTOR_SIZE);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function upsert(points: DocumentPoint[]): Promise<void> {
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

async function searchDocuments(
  query: string,
  topK = 5,
): Promise<DocumentResult[]> {
  await init();
  const results = await rawSearch(query, COLLECTION, topK);
  return results as DocumentResult[];
}

async function deleteDocuments(ids: string[]): Promise<void> {
  await deletePoints(COLLECTION, ids);
}

async function get(id: string): Promise<DocumentPoint['payload'] | null> {
  const payload = await getPoint(COLLECTION, id);
  return payload as DocumentPoint['payload'] | null;
}

export const documents = { upsert, search: searchDocuments, delete: deleteDocuments, get };