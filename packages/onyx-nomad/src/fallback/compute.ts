// packages/onyx-nomad/src/fallback/compute.ts
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { ComputeBackend } from '../types';

const MODELS_DIR = path.resolve('./models');
const OLLAMA_URL = 'http://localhost:11434/api/tags';
const LMSTUDIO_URL = 'http://localhost:1234/v1/models';

/**
 * getAvailableBackend — probes local compute resources in priority order.
 *
 * Priority:
 *   1. LiteRT edge models (.tflite files in ./models/)
 *   2. Ollama  (http://localhost:11434)
 *   3. LM Studio (http://localhost:1234)
 *
 * Throws NoComputeAvailable if nothing is found.
 */
export async function getAvailableBackend(): Promise<ComputeBackend> {
  // 1. Check for .tflite edge model files
  try {
    const files = await readdir(MODELS_DIR);
    const hasTflite = files.some((f) => f.endsWith('.tflite'));
    if (hasTflite) {
      return 'edge';
    }
  } catch {
    // ./models/ does not exist or is unreadable — continue
  }

  // 2. Probe Ollama
  try {
    const res = await fetch(OLLAMA_URL, {
      signal: AbortSignal.timeout(1000),
    });
    if (res.ok) {
      return 'local-ollama';
    }
  } catch {
    // Ollama not running — continue
  }

  // 3. Probe LM Studio
  try {
    const res = await fetch(LMSTUDIO_URL, {
      signal: AbortSignal.timeout(1000),
    });
    if (res.ok) {
      return 'local-lmstudio';
    }
  } catch {
    // LM Studio not running — continue
  }

  throw new Error(
    'NoComputeAvailable: run Ollama or configure LiteRT models in ./models/'
  );
}