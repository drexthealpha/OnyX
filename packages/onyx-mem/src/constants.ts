// ─────────────────────────────────────────────
// onyx-mem · constants.ts
// ─────────────────────────────────────────────

/** Max tokens allowed in a compressed MemoryCrystal. */
export const MEMORY_CRYSTAL_MAX_TOKENS = 500;

/** Package version. */
export const ONYX_MEM_VERSION = '0.1.0';

/** Qdrant base URL (local default). */
export const QDRANT_BASE_URL =
  process.env['QDRANT_URL'] ?? 'http://localhost:6333';

/** Qdrant collection name for memories. */
export const QDRANT_COLLECTION = 'memories';

/**
 * Placeholder embedding dimension until @onyx/semantic is live (S09).
 * Matches the 'all-MiniLM-L6-v2' model output size (384).
 */
export const EMBEDDING_DIM = 384;