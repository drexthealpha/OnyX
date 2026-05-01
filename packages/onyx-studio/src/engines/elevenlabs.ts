/**
 * @onyx/studio — ElevenLabs TTS engine wrapper
 *
 * Wraps the @onyx/voice elevenlabs-tts implementation.
 */

import type { TTSEngine, VoiceConfig } from './index';

export class ElevenLabsEngine implements TTSEngine {
  name = 'elevenlabs';

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    const { synthesize } = await import('@onyx/voice');
    return synthesize(text, config?.voice ?? '21m00Tcm4TjDgg2Cwh6c');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { synthesize } = await import('@onyx/voice');
      return typeof synthesize === 'function';
    } catch {
      return false;
    }
  }
}
    return elevenModule.synthesize(text, voiceId);
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.ELEVENLABS_API_KEY;
  }
}