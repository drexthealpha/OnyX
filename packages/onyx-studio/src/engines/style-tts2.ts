/**
 * @onyx/studio — StyleTTS2 TTS engine
 *
 * StyleTTS2 is an open-source expressive TTS engine.
 * Uses `python -m styletts2_infer` to synthesize audio.
 */

import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { TTSEngine, VoiceConfig } from './index.js';

export class StyleTTS2Engine implements TTSEngine {
  name = 'style-tts2';

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    const id = randomUUID();
    const outPath = `/tmp/styletts2_out_${id}.wav`;

    const args = [
      '-m', 'styletts2_infer',
      '--text', text,
      '--output', outPath,
    ];

    if (config?.voice) {
      args.push('--ref', config.voice);
    }
    if (config?.speed) {
      args.push('--speed', String(config.speed));
    }

    await this.runPython(...args);

    const buf = await readFile(outPath);
    await rm(outPath, { force: true }).catch(() => {});

    if (buf.byteLength === 0) {
      throw new Error('[onyx-studio/style-tts2] empty output');
    }

    return buf;
  }

  async isAvailable(): Promise<boolean> {
    return this.runPython('-c', 'import styletts2')
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
        else reject(new Error(`[onyx-studio/style-tts2] ${stderr}`));
      });
    });
  }
}