/**
 * @onyx/voice — Edge TTS
 *
 * Free Microsoft Edge TTS via the `edge-tts` npm package.
 * No API key required. Default voice: en-US-AriaNeural.
 */

import { tts as edgeTts } from 'edge-tts';

const DEFAULT_VOICE = 'en-US-AriaNeural';

export async function synthesize(
  text: string,
  voice: string = DEFAULT_VOICE,
): Promise<Buffer> {
  return edgeTts(text, { voice });
}
