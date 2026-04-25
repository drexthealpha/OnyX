/**
 * @onyx/voice — Whisper transcription
 *
 * Sends an audio Buffer to the OpenAI Whisper API and returns the transcript.
 * Model: whisper-1. Language: auto-detect.
 * Requires OPENAI_API_KEY in env (user-provided, operator cost: $0).
 */

import { Blob } from 'node:buffer';

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('[onyx-voice] OPENAI_API_KEY is not set');
  return key;
}

/**
 * Transcribe an audio Buffer using OpenAI Whisper (whisper-1).
 * @param audioBuffer  Raw audio bytes (wav, mp3, m4a, ogg, flac, webm supported)
 * @param filename     Optional filename hint — helps Whisper detect format
 */
export async function transcribe(
  audioBuffer: Buffer,
  filename = 'audio.wav',
): Promise<string> {
  const apiKey = getApiKey();

  const form = new globalThis.FormData();
  const blob = new Blob([audioBuffer]);
  form.append('file', blob, filename);
  form.append('model', 'whisper-1');

  const response = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`[onyx-voice/whisper] API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { text: string };
  return data.text.trim();
}