/**
 * @onyx/studio — Agent integration
 *
 * Allows agents to register custom TTS engines at runtime without code changes.
 * Custom engines are persisted to ./data/tts-engines.json.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { registerEngine, type TTSEngine, type VoiceConfig } from './index.js';

const DATA_DIR = './data';
const ENGINES_FILE = join(DATA_DIR, 'tts-engines.json');

export interface CustomEngineConfig {
  name: string;
  command: string;
  outputPath: string;
}

async function loadEngines(): Promise<CustomEngineConfig[]> {
  try {
    const raw = await readFile(ENGINES_FILE, 'utf-8');
    return JSON.parse(raw) as CustomEngineConfig[];
  } catch {
    return [];
  }
}

async function saveEngines(engines: CustomEngineConfig[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ENGINES_FILE, JSON.stringify(engines, null, 2), 'utf-8');
}

export async function addEngine(config: CustomEngineConfig): Promise<void> {
  if (!config.name || !config.command || !config.outputPath) {
    throw new Error('[onyx/studio/agent] name, command, and outputPath are all required');
  }

  const engines = await loadEngines();
  const existing = engines.findIndex((e) => e.name === config.name);
  if (existing >= 0) {
    engines[existing] = config;
  } else {
    engines.push(config);
  }
  await saveEngines(engines);

  registerEngine(buildCustomEngine(config));
}

export async function listEngines(): Promise<CustomEngineConfig[]> {
  return loadEngines();
}

export async function removeEngine(name: string): Promise<void> {
  const engines = await loadEngines();
  const filtered = engines.filter((e) => e.name !== name);
  await saveEngines(filtered);
}

export async function restoreEngines(): Promise<void> {
  const engines = await loadEngines();
  for (const config of engines) {
    registerEngine(buildCustomEngine(config));
  }
}

function buildCustomEngine(config: CustomEngineConfig): TTSEngine {
  return {
    name: config.name,

    async synthesize(text: string, _config?: VoiceConfig): Promise<Buffer> {
      const id = randomUUID();
      const outPath = config.outputPath.replace('{id}', id);

      const [cmd, ...baseArgs] = config.command.split(/\s+/);
      const args = [...baseArgs, '--text', text, '--output', outPath];

      await new Promise<void>((resolve, reject) => {
        const proc = spawn(cmd!, args, { stdio: ['ignore', 'pipe', 'pipe'] });
        const stderr: string[] = [];
        proc.stderr?.on('data', (d: Buffer) => stderr.push(d.toString()));
        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else
            reject(
              new Error(
                `[onyx/studio/${config.name}] process exited ${code}: ${stderr.join('')}`,
              ),
            );
        });
      });

      const { readFile: readFileAsync, rm } = await import('node:fs/promises');
      const buf = await readFileAsync(outPath);
      await rm(outPath, { force: true }).catch(() => void 0);
      return buf;
    },

    async isAvailable(): Promise<boolean> {
      return true;
    },
  };
}