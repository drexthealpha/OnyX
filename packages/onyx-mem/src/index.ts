// ─────────────────────────────────────────────
// onyx-mem · index.ts
// Public barrel export — everything consumers need.
// ─────────────────────────────────────────────

// Types
export type {
  MemoryCrystal,
  MemoryMode,
  ConversationTelemetry,
  SemanticSearchResult,
  CompressionResult,
} from './types.js';

// Constants
export {
  MEMORY_CRYSTAL_MAX_TOKENS,
  ONYX_MEM_VERSION,
  QDRANT_BASE_URL,
  QDRANT_COLLECTION,
  EMBEDDING_DIM,
} from './constants.js';

// Capture
export {
  initCapture,
  getSessionBuffer,
  clearSessionBuffer,
  pushTelemetry,
  getActiveSessionCount,
} from './capture.js';

// Compress
export { compress } from './compress.js';

// Store
export { saveCrystal, getCrystal, listCrystals, saveCrystal as store } from './store.js';

// Inject
export { inject } from './inject.js';

// Lifecycle (primary integration surface)
export { onSessionStart, onSessionEnd } from './lifecycle.js';

// Mode hints (for downstream packages that want to extend compression)
export { getModeHints } from './modes/index.js';