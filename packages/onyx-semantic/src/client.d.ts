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
export declare function getQdrant(): QdrantClient;
export interface UpsertPoint {
    id: string;
    vector: number[];
    payload: unknown;
}
/**
 * Ensure a collection exists with the given cosine-distance vector config.
 * No-ops if the collection already exists.
 */
export declare function createCollectionIfNotExists(name: string, vectorSize: number): Promise<void>;
/**
 * Upsert one or more points into a collection.
 * Each point must have a string UUID id, a float vector, and an arbitrary payload.
 */
export declare function upsert(collection: string, points: UpsertPoint[]): Promise<void>;
/**
 * Delete points by their string IDs.
 */
export declare function deletePoints(collection: string, ids: string[]): Promise<void>;
/**
 * Retrieve a single point by ID. Returns null if not found.
 */
export declare function getPoint(collection: string, id: string): Promise<unknown>;
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
export declare function createSemanticClient(): SemanticClient;
//# sourceMappingURL=client.d.ts.map