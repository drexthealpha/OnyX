// packages/onyx-compute/src/router.ts
//
// Compute backend router — decides which backend to use in priority order:
//   1. NOMAD_MODE=true           → 'edge'          (Google AI Edge / LiteRT-LM)
//   2. Ollama running locally    → 'local-ollama'   (http://localhost:11434)
//   3. LM Studio running locally → 'local-lmstudio' (http://localhost:1234)
//   4. NOSANA_PRIVATE_KEY set    → 'nosana'         (decentralised GPU, user pays)
//   5. throw                     → no compute available

export type ComputeBackend = 'qvac' | 'edge' | 'local-ollama' | 'local-lmstudio' | 'nosana';

const OLLAMA_URL = 'http://localhost:11434/api/tags';
const LM_STUDIO_URL = 'http://localhost:1234/v1/models';
const PROBE_TIMEOUT_MS = 2_000;

/**
 * Probe a local HTTP endpoint with a short timeout.
 * Returns true if the server responds with any 2xx status.
 */
async function probe(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

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
export async function getCompute(): Promise<ComputeBackend> {
  const { isAvailable } = await import('@onyx/qvac');
  if (await isAvailable()) return 'qvac';

  // 1. Nomad / edge mode (on-device LiteRT-LM inference)
  if (process.env.NOMAD_MODE === 'true') {
    return 'edge';
  }

  // 2. Local Ollama
  if (await probe(OLLAMA_URL)) {
    return 'local-ollama';
  }

  // 3. Local LM Studio (OpenAI-compatible)
  if (await probe(LM_STUDIO_URL)) {
    return 'local-lmstudio';
  }

  // 4. Nosana decentralised GPU (user provides private key, pays with NOS tokens)
  if (process.env.NOSANA_PRIVATE_KEY) {
    return 'nosana';
  }

  // 5. No compute available
  throw new Error(
    'No compute available. ' +
      'Set NOMAD_MODE=true for on-device inference, ' +
      'run Ollama (ollama serve) or LM Studio for local inference, ' +
      'or set NOSANA_PRIVATE_KEY to use the Nosana decentralised GPU network.'
  );
}