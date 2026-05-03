/**
 * @onyx/studio — ElevenLabs TTS engine wrapper
 *
 * Wraps the @onyx/voice elevenlabs-tts implementation.
 */

import type { TTSEngine, VoiceConfig } from '../index.js';

export class ElevenLabsEngine implements TTSEngine {
  name = 'elevenlabs';

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    const { elevenLabs } = await import('@onyx/voice');
    return elevenLabs.synthesize(text, config?.voice ?? '21m00Tcm4TjDgg2Cwh6c');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { elevenLabs } = await import('@onyx/voice');
      return typeof elevenLabs.synthesize === 'function';
    } catch {
      return false;
    }
  }
}