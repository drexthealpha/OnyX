/**
 * @onyx/studio — Edge TTS engine wrapper
 *
 * Wraps the @onyx/voice edge-tts implementation.
 */

import type { TTSEngine, VoiceConfig } from './index.js';

export class EdgeTTSEngine implements TTSEngine {
  name = 'edge';

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    const edgeModule = await import('@onyx/voice/tts/edge.js');
    return edgeModule.synthesize(text, config?.voice ?? 'en-US-AriaNeural');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await import('@onyx/voice/tts/edge.js');
      return true;
    } catch {
      return false;
    }
  }
}