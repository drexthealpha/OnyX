/**
 * @onyx/studio — Edge TTS engine wrapper
 *
 * Wraps the @onyx/voice edge-tts implementation.
 */

import type { TTSEngine, VoiceConfig } from './index';

export class EdgeTTSEngine implements TTSEngine {
  name = 'edge';

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    const { synthesize } = await import('@onyx/voice');
    return synthesize(text, config?.voice ?? 'en-US-AriaNeural');
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