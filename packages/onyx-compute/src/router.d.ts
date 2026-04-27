export type ComputeBackend = 'edge' | 'local-ollama' | 'local-lmstudio' | 'nosana';
/**
 * Resolve the best available compute backend.
 *
 * Decision order (first match wins):
 * 1. process.env.NOMAD_MODE === 'true'        → 'edge'
 * 2. Ollama responds at localhost:11434        → 'local-ollama'
 * 3. LM Studio responds at localhost:1234      → 'local-lmstudio'
 * 4. process.env.NOSANA_PRIVATE_KEY is set     → 'nosana'
 * 5. throw Error                              (no compute available)
 */
export declare function getCompute(): Promise<ComputeBackend>;
//# sourceMappingURL=router.d.ts.map