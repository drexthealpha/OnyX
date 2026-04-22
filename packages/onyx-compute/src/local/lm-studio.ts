// packages/onyx-compute/src/local/lm-studio.ts
//
// Local LM Studio inference via its OpenAI-compatible REST API.
// LM Studio docs: https://lmstudio.ai/docs/api/rest-api
// Default base URL: http://localhost:1234

const BASE_URL = process.env.LM_STUDIO_URL ?? 'http://localhost:1234';
const PROBE_TIMEOUT_MS = 2_000;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionChoice {
  message: ChatMessage;
  finish_reason: string;
  index: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  model: string;
  choices: CompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelsResponse {
  object: string;
  data: Array<{ id: string; object: string }>;
}

/**
 * Check if LM Studio is running and reachable on localhost.
 */
export async function isAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/v1/models`, {
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
 * List all models currently loaded in LM Studio.
 */
export async function listModels(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/v1/models`);
  if (!res.ok) {
    throw new Error(`LM Studio listModels failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as ModelsResponse;
  return data.data.map((m) => m.id);
}

/**
 * Generate a completion using LM Studio's OpenAI-compatible API.
 *
 * @param model  - Model identifier (e.g. 'lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF')
 * @param prompt - User prompt string
 * @returns      - Generated text response
 */
export async function generate(model: string, prompt: string): Promise<string> {
  return chat(model, [{ role: 'user', content: prompt }]);
}

/**
 * Multi-turn chat via LM Studio's OpenAI-compatible /v1/chat/completions endpoint.
 *
 * @param model    - Model identifier
 * @param messages - Conversation history
 * @returns        - Assistant reply text
 */
export async function chat(model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LM Studio generate failed: HTTP ${res.status} — ${text}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  return data.choices[0]?.message?.content ?? '';
}