/**
 * @onyx/voice — Wake-word detection
 *
 * Listens for the "ONYX" wake word using @picovoice/porcupine-node.
 * Emits 'wakeWordDetected' event via @onyx/multica herald (optional peer dep).
 *
 * Requires PICOVOICE_KEY in env (user-provided, operator cost: $0).
 */

import { EventEmitter } from 'node:events';

const WAKE_WORD = 'ONYX';

export interface WakeWordOptions {
  keywordPath?: string;
  sensitivity?: number;
}

export class WakeWordDetector extends EventEmitter {
  private handle: PorcupineHandle | null = null;
  private running = false;
  private opts: Required<WakeWordOptions>;

  constructor(opts: WakeWordOptions = {}) {
    super();
    this.opts = {
      keywordPath: opts.keywordPath ?? '',
      sensitivity: opts.sensitivity ?? 0.5,
    };
  }

  async init(): Promise<void> {
    const accessKey = process.env.PICOVOICE_KEY;
    if (!accessKey) {
      throw new Error('[onyx-voice/wake-word] PICOVOICE_KEY is not set');
    }

    let PorcupineModule: PorcupineModule;
    try {
      PorcupineModule = await import('@picovoice/porcupine-node') as unknown as PorcupineModule;
    } catch {
      throw new Error(
        '[onyx-voice/wake-word] @picovoice/porcupine-node not installed. Run: bun add @picovoice/porcupine-node',
      );
    }

    const { Porcupine, BuiltinKeyword } = PorcupineModule;

    const keyword = this.opts.keywordPath
      ? { filePath: this.opts.keywordPath, sensitivity: this.opts.sensitivity }
      : { builtin: BuiltinKeyword.COMPUTER, sensitivity: this.opts.sensitivity };

    this.handle = new Porcupine(accessKey, [keyword]);
    this.running = true;

    this.emit('ready', { frameLength: this.handle.frameLength, sampleRate: this.handle.sampleRate });
  }

  processFrame(frame: Int16Array): boolean {
    if (!this.handle || !this.running) return false;

    const keywordIndex = this.handle.process(frame);
    if (keywordIndex >= 0) {
      this.emit('wakeWordDetected', WAKE_WORD);
      this._broadcastViaHerald();
      return true;
    }
    return false;
  }

  destroy(): void {
    this.running = false;
    if (this.handle) {
      this.handle.release();
      this.handle = null;
    }
  }

  get frameLength(): number {
    return this.handle?.frameLength ?? 512;
  }

  get sampleRate(): number {
    return this.handle?.sampleRate ?? 16_000;
  }

  private _broadcastViaHerald(): void {
    import('@onyx/multica')
      .then((mod) => mod.globalHerald.publish('voice:wakeWordDetected', { word: WAKE_WORD }))
      .catch(() => {});
  }
}

interface PorcupineHandle {
  process(frame: Int16Array): number;
  release(): void;
  frameLength: number;
  sampleRate: number;
}

interface PorcupineModule {
  Porcupine: new (
    accessKey: string,
    keywords: Array<{ builtin?: string; filePath?: string; sensitivity: number }>,
  ) => PorcupineHandle;
  BuiltinKeyword: Record<string, string>;
}