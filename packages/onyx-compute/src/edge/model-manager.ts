// packages/onyx-compute/src/edge/model-manager.ts
//
// Download and manage LiteRT-LM model files locally.
// Models are stored in ./models/ relative to the working directory.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as http from 'node:http';

const MODELS_DIR = path.join(process.cwd(), 'models');

function ensureModelsDir(): void {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }
}

/**
 * Download a model file from a URL and save it locally.
 *
 * @param name - Local filename to save as (e.g. 'gemma-4-E2B-it.litertlm')
 * @param url  - Full HTTPS URL to download from
 * @returns    - Absolute local path of the downloaded file
 */
export async function downloadModel(name: string, url: string): Promise<string> {
  ensureModelsDir();
  const localPath = path.join(MODELS_DIR, name);

  if (fs.existsSync(localPath)) {
    console.info(`[ModelManager] "${name}" already exists at ${localPath}. Skipping download.`);
    return localPath;
  }

  console.info(`[ModelManager] Downloading "${name}" from ${url} ...`);

  return new Promise<string>((resolve, reject) => {
    const file = fs.createWriteStream(localPath);
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Follow redirects (HuggingFace uses 302)
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        file.close();
        fs.unlinkSync(localPath);
        downloadModel(name, response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(localPath);
        reject(new Error(`[ModelManager] HTTP ${response.statusCode} downloading "${name}"`));
        return;
      }

      const total = parseInt(response.headers['content-length'] ?? '0', 10);
      let downloaded = 0;

      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (total > 0) {
          const pct = ((downloaded / total) * 100).toFixed(1);
          process.stdout.write(`\r[ModelManager] ${name}: ${pct}%`);
        }
      });

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.info(`\n[ModelManager] "${name}" saved to ${localPath}`);
        resolve(localPath);
      });
    });

    request.on('error', (err) => {
      fs.existsSync(localPath) && fs.unlinkSync(localPath);
      reject(err);
    });

    file.on('error', (err) => {
      fs.existsSync(localPath) && fs.unlinkSync(localPath);
      reject(err);
    });
  });
}

/**
 * List all model files in the local models directory.
 * Returns filenames (not full paths).
 */
export function listModels(): string[] {
  ensureModelsDir();
  return fs
    .readdirSync(MODELS_DIR)
    .filter((f) => f.endsWith('.litertlm') || f.endsWith('.tflite'));
}

/**
 * Check if a specific model is already downloaded.
 * @param name - Model filename (e.g. 'gemma-4-E2B-it.litertlm')
 */
export function isAvailable(name: string): boolean {
  const localPath = path.join(MODELS_DIR, name);
  return fs.existsSync(localPath);
}

/**
 * Delete a locally cached model.
 * @param name - Model filename
 */
export function deleteModel(name: string): void {
  const localPath = path.join(MODELS_DIR, name);
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
    console.info(`[ModelManager] Deleted "${name}"`);
  }
}

/**
 * Get the full local path for a model.
 * @param name - Model filename
 */
export function getModelPath(name: string): string {
  return path.join(MODELS_DIR, name);
}