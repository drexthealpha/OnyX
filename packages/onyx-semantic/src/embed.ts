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

type Pipeline = (
  text: string,
  options: { pooling: string; normalize: boolean },
) => Promise<{ data: Float32Array }>;

let _pipeline: Pipeline | undefined;

async function getPipeline(): Promise<Pipeline> {
  if (_pipeline) return _pipeline;

  const { pipeline } = await import('@xenova/transformers');
  _pipeline = (await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
  )) as unknown as Pipeline;
  return _pipeline;
}

/**
 * Deterministic 384-dim mock vector for testing.
 * Not semantically meaningful — only used when NODE_ENV === 'test'.
 */
function mockEmbed(text: string): Float32Array {
  const DIM = 384;
  const vec = new Float32Array(DIM);
  let norm = 0;
  for (let i = 0; i < DIM; i++) {
    const charCode = text.charCodeAt(i % text.length) || 1;
    vec[i] = Math.sin(i * charCode * 0.001 + charCode);
    norm += vec[i]! * vec[i]!;
  }
  norm = Math.sqrt(norm);
  for (let i = 0; i < DIM; i++) {
    vec[i] = vec[i]! / norm;
  }
  return vec;
}

/**
 * Embed a string into a 384-dim Float32Array.
 *
 * - Production: uses local ONNX inference (first call downloads ~22 MB once)
 * - Test env (NODE_ENV=test): returns deterministic mock — fast, offline-safe
 */
export async function embed(text: string): Promise<Float32Array> {
  if (process.env['NODE_ENV'] === 'test') {
    return mockEmbed(text);
  }

  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return output.data;
}