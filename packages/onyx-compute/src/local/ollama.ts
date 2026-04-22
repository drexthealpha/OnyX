// packages/onyx-compute/src/local/ollama.ts
//
// Local Ollama inference via its REST API.
// Ollama docs: https://github.com/ollama/ollama/blob/main/docs/api.md
// Default base URL: http://localhost:11434

const BASE_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const PROBE_TIMEOUT_MS = 2_000;

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_k?: number;
    top_p?: number;
    num_predict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

export interface OllamaTagsResponse {
  models: Array<{
    name: string;
    size: number;
    digest: string;
  }>;
}

/**
 * Check if Ollama is running and reachable on localhost.
 */
export async function isAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
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
 * List all locally available Ollama models.
 */
export async function listModels(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/tags`);
  if (!res.ok) {
    throw new Error(`Ollama listModels failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as OllamaTagsResponse;
  return data.models.map((m) => m.name);
}

/**
 * Generate a completion using a locally running Ollama model.
 *
 * @param model  - Model name as known to Ollama (e.g. 'llama3', 'mistral')
 * @param prompt - User prompt string
 * @returns      - Generated text response
 */
export async function generate(model: string, prompt: string): Promise<string> {
  const body: OllamaGenerateRequest = {
    model,
    prompt,
    stream: false,
  };

  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama generate failed: HTTP ${res.status} — ${text}`);
  }

  const data = (await res.json()) as OllamaGenerateResponse;
  return data.response;
}

/**
 * OpenAI-compatible chat completion via Ollama.
 * Ollama exposes /v1/chat/completions since v0.1.14.
 */
export async function chat(
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama chat failed: HTTP ${res.status} — ${text}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '';
}