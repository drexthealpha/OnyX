// packages/onyx-nomad/src/tests/nomad.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';

// ─── Test 1: isOnline returns a boolean (true in most envs) ─────────────────────

describe('isOnline', () => {
  test('returns a boolean', async () => {
    const { isOnline } = await import('../detect');
    const result = await isOnline();
    expect(typeof result).toBe('boolean');
  });
});

// ─── Test 2: getAvailableBackend returns 'edge' when .tflite exists ───────────

describe('getAvailableBackend', () => {
  const modelsDir = path.resolve('./models');

  beforeEach(() => {
    mkdirSync(modelsDir, { recursive: true });
    writeFileSync(path.join(modelsDir, 'model.tflite'), 'fake-tflite-data');
  });

  afterEach(() => {
    rmSync(modelsDir, { recursive: true, force: true });
  });

  test("returns 'edge' when .tflite file exists in ./models/", async () => {
    const { getAvailableBackend } = await import('../fallback/compute');
    const backend = await getAvailableBackend();
    expect(backend).toBe('edge');
  });
});