// packages/onyx-nomad/src/types.ts

/**
 * Available offline compute backends in priority order:
 * - 'edge'          → LiteRT .tflite model files found in ./models/
 * - 'local-ollama'  → Ollama running at http://localhost:11434
 * - 'local-lmstudio'→ LM Studio running at http://localhost:1234
 */
export type ComputeBackend = 'qvac' | 'edge' | 'local-ollama' | 'local-lmstudio';

/**
 * A serialisable operation queued while the device is offline.
 * Persisted as newline-delimited JSON in ./data/offline-queue.ndjson
 */
export interface OfflineOperation {
  /** UUID v4 */
  id: string;
  /** Discriminator — used by flush() to route execution */
  type: string;
  /** Arbitrary parameters for the operation */
  params: unknown;
  /** Unix timestamp (ms) when the operation was enqueued */
  timestamp: number;
}

/**
 * Result returned after a sync cycle completes.
 */
export interface SyncResult {
  /** Number of queued operations successfully flushed */
  flushedOps: number;
  /** Number of memory crystals synced to remote Qdrant */
  crystalsSynced: number;
  /** Number of documents re-embedded via @onyx/semantic */
  docsReEmbedded: number;
  /** Timestamp (ms) when this sync completed */
  completedAt: number;
  /** Any errors encountered during the sync (non-fatal) */
  errors: string[];
}

/**
 * Live runtime state of the Nomad subsystem.
 */
export interface NomadState {
  /** Whether the device currently has internet access */
  isOnline: boolean;
  /** Active compute backend (null if not yet detected) */
  activeBackend: ComputeBackend | null;
  /** Number of operations currently in the offline queue */
  pendingOps: number;
  /** Timestamp (ms) of the last successful sync, or null */
  lastSyncAt: number | null;
  /** Whether the sync daemon is currently running */
  daemonRunning: boolean;
}

/**
 * A single search result from offline SQLite FTS5 search.
 */
export interface SearchResult {
  id: string;
  collection: string;
  content: string;
  score: number;
}

/**
 * Minimal IntelBrief shape — mirrors @onyx/intel's export.
 * Defined locally to avoid circular deps during offline operation.
 */
export interface IntelBrief {
  topic: string;
  summary: string;
  sources: string[];
  score: number;
  timestamp: number;
}