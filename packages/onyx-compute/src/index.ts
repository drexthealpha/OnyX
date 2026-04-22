// packages/onyx-compute/src/index.ts
export { getCompute } from './router.js';
export type { ComputeBackend } from './router.js';

// Nosana sub-exports
export { getNosanaClient } from './nosana/client.js';
export { JobBuilder } from './nosana/job-builder.js';
export { selectMarket } from './nosana/markets.js';
export type { MarketStrategy } from './nosana/markets.js';

// Edge sub-exports
export { runInference } from './edge/liteRT.js';
export { downloadModel, listModels, isAvailable as isModelAvailable } from './edge/model-manager.js';
export { GEMMA4_E2B_CONFIG, GEMMA4_E4B_CONFIG } from './edge/gallery.js';

// Local sub-exports
export * as ollama from './local/ollama.js';
export * as lmStudio from './local/lm-studio.js';