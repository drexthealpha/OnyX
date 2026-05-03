/**
 * Local text embedding using @xenova/transformers.
 *
 * Model: Xenova/all-MiniLM-L6-v2
 *   - 384-dimensional cosine embeddings
 *   - ~22 MB quantised ONNX weights, cached after first load
 *   - Zero API cost, zero user API key required
 *
 * Test environment: falls back to a deterministic mock vector
 * derived from the text's character codes so tests remain fast and
 * offline-safe without a real model download.
 */
/**
 * Embed a string into a 384-dim Float32Array.
 *
 * - Production: uses local ONNX inference (first call downloads ~22 MB once)
 * - Test env (NODE_ENV=test): returns deterministic mock — fast, offline-safe
 */
export declare function embed(text: string): Promise<Float32Array>;
//# sourceMappingURL=embed.d.ts.map