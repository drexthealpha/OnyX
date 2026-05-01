/**
 * @onyx/studio — engine registry + barrel export
 *
 * TTSEngine interface:
 *   { name: string; synthesize(text, config?): Promise<Buffer>; isAvailable(): Promise<boolean> }
 *
 * VoiceConfig:
 *   { speed?: number; pitch?: number; voice?: string }
 */

export const NAME = 'onyx-studio';

export interface VoiceConfig {
  speed?: number;
  pitch?: number;
  voice?: string;
}

export interface TTSEngine {
  name: string;
  synthesize(text: string, config?: VoiceConfig): Promise<Buffer>;
  isAvailable(): Promise<boolean>;
}

export { KokoroEngine } from './engines/kokoro';
export { StyleTTS2Engine } from './engines/style-tts2';
export { OrpheusEngine } from './engines/orpheus';
export { EdgeTTSEngine } from './engines/edge-tts';
export { ElevenLabsEngine } from './engines/elevenlabs';

export {
  addEngine,
  listEngines,
  removeEngine,
  type CustomEngineConfig,
} from './agent-integration';

const _registry = new Map<string, TTSEngine>();

export function registerEngine(engine: TTSEngine): void {
  _registry.set(engine.name, engine);
}

export function getEngine(name: string): TTSEngine | undefined {
  return _registry.get(name);
}

export function listRegisteredEngines(): string[] {
  return [..._registry.keys()];
}

export async function synthesizeWith(
  engineName: string,
  text: string,
  config?: VoiceConfig,
): Promise<Buffer> {
  const engine = _registry.get(engineName);
  if (!engine) throw new Error(`[onyx/studio] Engine "${engineName}" not registered`);

  const available = await engine.isAvailable();
  if (!available) {
    const edgeEngine = _registry.get('edge');
    if (edgeEngine) {
      console.warn(`[onyx/studio] ${engineName} unavailable — falling back to edge`);
      return edgeEngine.synthesize(text, config);
    }
    throw new Error(`[onyx/studio] Engine "${engineName}" is not available`);
  }

  return engine.synthesize(text, config);
}

import { KokoroEngine } from './engines/kokoro';
import { EdgeTTSEngine } from './engines/edge-tts';
import { ElevenLabsEngine } from './engines/elevenlabs';
import { StyleTTS2Engine } from './engines/style-tts2';
import { OrpheusEngine } from './engines/orpheus';

registerEngine(new KokoroEngine());
registerEngine(new EdgeTTSEngine());
registerEngine(new ElevenLabsEngine());
registerEngine(new StyleTTS2Engine());
registerEngine(new OrpheusEngine());