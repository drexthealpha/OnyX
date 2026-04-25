/**
 * @onyx/voice — OpenAI TTS
 *
 * Synthesizes speech via the OpenAI TTS API.
 * Model: tts-1. Voice: alloy.
 * Requires OPENAI_API_KEY in env (user-provided, operator cost: $0).
 */

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const DEFAULT_MODEL = 'tts-1';
const DEFAULT_VOICE = 'alloy';

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('[onyx-voice] OPENAI_API_KEY is not set');
  return key;
}

export async function synthesize(
  text: string,
  voice: OpenAIVoice = DEFAULT_VOICE,
  model: 'tts-1' | 'tts-1-hd' = DEFAULT_MODEL,
): Promise<Buffer> {
  const apiKey = getApiKey();

  const response = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`[onyx-voice/openai-tts] API error ${response.status}: ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}