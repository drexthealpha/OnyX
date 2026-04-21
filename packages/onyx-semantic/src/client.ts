/**
 * Thin wrapper around @qdrant/js-client-rest.
 * Provides the four primitive operations needed by all collection wrappers:
 *   createCollectionIfNotExists / upsert / delete / get
 *
 * Base URL: http://localhost:6333  (local Qdrant docker)
 */

import { QdrantClient } from '@qdrant/js-client-rest';

import { memories } from './collections/memories.js';
import { documents } from './collections/documents.js';
import { research } from './collections/research.js';
import { skills } from './collections/skills.js';
import { marketSignals } from './collections/market-signals.js';

// ─── Singleton Qdrant client ──────────────────────────────────────────────────

const BASE_URL = process.env['QDRANT_URL'] ?? 'http://localhost:6333';

let _qdrant: QdrantClient | undefined;

export function getQdrant(): QdrantClient {
  if (!_qdrant) {
    _qdrant = new QdrantClient({ url: BASE_URL, checkCompatibility: false });
  }
  return _qdrant;
}

// ─── Primitive helpers ────────────────────────────────────────────────────────

export interface UpsertPoint {
  id: string;
  vector: number[];
  payload: unknown;
}

/**
 * Ensure a collection exists with the given cosine-distance vector config.
 * No-ops if the collection already exists.
 */
export async function createCollectionIfNotExists(
  name: string,
  vectorSize: number,
): Promise<void> {
  const client = getQdrant();
  const { exists } = await client.collectionExists(name);
  if (!exists) {
    await client.createCollection(name, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });
  }
}

/**
 * Upsert one or more points into a collection.
 * Each point must have a string UUID id, a float vector, and an arbitrary payload.
 */
export async function upsert(
  collection: string,
  points: UpsertPoint[],
): Promise<void> {
  const client = getQdrant();
  await client.upsert(collection, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload as Record<string, unknown>,
    })),
  });
}

/**
 * Delete points by their string IDs.
 */
export async function deletePoints(
  collection: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const client = getQdrant();
  await client.delete(collection, { wait: true, points: ids });
}

/**
 * Retrieve a single point by ID. Returns null if not found.
 */
export async function getPoint(
  collection: string,
  id: string,
): Promise<unknown> {
  const client = getQdrant();
  const results = await client.retrieve(collection, {
    ids: [id],
    with_payload: true,
  });
  if (results.length === 0) return null;
  return results[0]!.payload ?? null;
}

// ─── High-level semantic client ───────────────────────────────────────────────

export interface SemanticClient {
  /** Raw Qdrant client — use for advanced queries */
  qdrant: QdrantClient;
  /** Primitive helpers */
  createCollectionIfNotExists: typeof createCollectionIfNotExists;
  upsert: typeof upsert;
  delete: typeof deletePoints;
  get: typeof getPoint;
  /** Typed collection wrappers */
  memories: typeof memories;
  documents: typeof documents;
  research: typeof research;
  skills: typeof skills;
  marketSignals: typeof marketSignals;
}

/**
 * Factory — returns the full semantic client surface.
 *
 * @example
 * ```ts
 * const sem = createSemanticClient();
 * await sem.memories.upsert([{ id: 'x', text: 'hello', payload: { timestamp: Date.now(), source: 'agent' } }]);
 * const hits = await sem.memories.search('hello', 3);
 * ```
 */
export function createSemanticClient(): SemanticClient {
  return {
    qdrant: getQdrant(),
    createCollectionIfNotExists,
    upsert,
    delete: deletePoints,
    get: getPoint,
    memories,
    documents,
    research,
    skills,
    marketSignals,
  };
}