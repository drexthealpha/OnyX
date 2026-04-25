/**
 * @onyx/studio — ElevenLabs TTS engine wrapper
 *
 * Wraps the @onyx/voice elevenlabs-tts implementation.
 */

import type { TTSEngine, VoiceConfig } from './index.js';

export class ElevenLabsEngine implements TTSEngine {
  name = 'elevenlabs';

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    const elevenModule = await import('@onyx/voice/tts/elevenlabs.js');
    const voiceId = config?.voice ?? process.env.ELEVENLABS_VOICE_ID;
    if (!voiceId) {
      throw new Error('[onyx-studio/elevenlabs] ELEVENLABS_VOICE_ID is required');
    }
    return elevenModule.synthesize(text, voiceId);
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.ELEVENLABS_API_KEY;
  }
}