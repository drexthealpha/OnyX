/**
 * @onyx/studio — Orpheus TTS engine
 *
 * Orpheus is an open-source neural TTS engine.
 * Uses `python -m orpheus_tts` to synthesize audio.
 */

import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { TTSEngine, VoiceConfig } from './index.js';

export class OrpheusEngine implements TTSEngine {
  name = 'orpheus';

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    const id = randomUUID();
    const outPath = `/tmp/orpheus_out_${id}.wav`;

    const args = [
      '-m', 'orpheus_tts',
      '--text', text,
      '--output', outPath,
    ];

    if (config?.voice) {
      args.push('--voice', config.voice);
    }
    if (config?.speed) {
      args.push('--speed', String(config.speed));
    }

    await this.runPython(...args);

    const buf = await readFile(outPath);
    await rm(outPath, { force: true }).catch(() => {});

    if (buf.byteLength === 0) {
      throw new Error('[onyx-studio/orpheus] empty output');
    }

    return buf;
  }

  async isAvailable(): Promise<boolean> {
    return this.runPython('-c', 'import orpheus_tts')
      .then(() => true)
      .catch(() => false);
  }

  private runPython(...args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stderr = '';
      proc.stderr?.on('data', (d) => { stderr += d.toString(); });
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`[onyx-studio/orpheus] ${stderr}`));
      });
    });
  }
}