/**
 * @onyx/studio — Edge TTS engine wrapper
 *
 * Wraps the @onyx/voice edge-tts implementation.
 */

import type { TTSEngine, VoiceConfig } from '../index.js';

export class EdgeTTSEngine implements TTSEngine {
  name = 'edge';

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    const { edgeTTS } = await import('@onyx/voice');
    return edgeTTS.synthesize(text, config?.voice ?? 'en-US-AriaNeural');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { edgeTTS } = await import('@onyx/voice');
      return typeof edgeTTS.synthesize === 'function';
    } catch {
      return false;
    }
  }
}