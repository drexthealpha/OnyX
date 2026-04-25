/**
 * @onyx/voice — ElevenLabs TTS
 *
 * Synthesizes speech via the ElevenLabs v1 API.
 * Model: eleven_multilingual_v2
 * Requires ELEVENLABS_API_KEY in env (user-provided, operator cost: $0).
 */

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';
const MODEL_ID = 'eleven_multilingual_v2';

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('[onyx-voice] ELEVENLABS_API_KEY is not set');
  return key;
}

export interface ElevenLabsConfig {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export async function synthesize(
  text: string,
  voiceId: string,
  config: ElevenLabsConfig = {},
): Promise<Buffer> {
  const apiKey = getApiKey();
  const url = `${ELEVENLABS_BASE}/${voiceId}`;

  const body = {
    text,
    model_id: MODEL_ID,
    voice_settings: {
      stability: config.stability ?? 0.5,
      similarity_boost: config.similarityBoost ?? 0.75,
      style: config.style ?? 0,
      use_speaker_boost: config.useSpeakerBoost ?? true,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`[onyx-voice/elevenlabs] API error ${response.status}: ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}