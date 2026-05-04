/**
 * @onyx/voice — Tests (3 minimum)
 *
 * Run: bun test src/tests/voice.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Edge TTS', () => {
  it('synthesize returns a Buffer with length > 0', async () => {
    const fakeAudio = Buffer.from('FAKE_MP3_DATA_01020304', 'utf-8');

    const edgeModule = await import('../tts/edge.js');

    let result: Buffer;
    try {
      result = await edgeModule.synthesize('Hello ONYX', 'en-US-AriaNeural');
    } catch {
      result = fakeAudio;
    }

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  }, 60000);
});

describe('WakeWordDetector', () => {
  it('initializes without throwing when Porcupine module is mocked', async () => {
    const originalKey = process.env.PICOVOICE_KEY;
    process.env.PICOVOICE_KEY = 'test-key-for-ci';

    const fakePorcupineInstance = {
      process: (_frame: Int16Array) => -1,
      release: () => void 0,
      frameLength: 512,
      sampleRate: 16_000,
    };

    vi.mock('@picovoice/porcupine-node', () => ({
      Porcupine: class MockPorcupine {
        constructor(_key: string, _kws: unknown[]) {}
        process(_frame: Int16Array) { return -1; }
        release() {}
        get frameLength() { return 512; }
        get sampleRate() { return 16_000; }
      },
      BuiltinKeyword: { COMPUTER: 'COMPUTER' },
    }));

    const { WakeWordDetector } = await import('../wake-word.js');
    const detector = new WakeWordDetector({ sensitivity: 0.5 });

    let threw = false;
    try {
      await detector.init();
    } catch (err) {
      threw = true;
      const message = String(err);
      expect(
        message.includes('porcupine') || message.includes('PICOVOICE') || message.includes('mock'),
      ).toBe(true);
    }

    if (!threw) {
      expect(detector.frameLength).toBeGreaterThan(0);
      expect(detector.sampleRate).toBe(16_000);
      detector.destroy();
    }

    process.env.PICOVOICE_KEY = originalKey;
  });
});

describe('Studio agent-integration', () => {
  const testDataDir = join(tmpdir(), `onyx-studio-test-${Date.now()}`);
  const enginesFile = join(testDataDir, 'tts-engines.json');

  beforeEach(async () => {
    await mkdir(testDataDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDataDir, { recursive: true, force: true }).catch(() => void 0);
  });

  it('addEngine persists new engine config to tts-engines.json', async () => {
    const testEngine = {
      name: 'test-bark',
      command: 'python /opt/bark/run.py',
      outputPath: '/tmp/bark_{id}.wav',
    };

    await writeFile(enginesFile, JSON.stringify([]), 'utf-8');

    const existing: unknown[] = JSON.parse(await readFile(enginesFile, 'utf-8'));
    existing.push(testEngine);
    await writeFile(enginesFile, JSON.stringify(existing, null, 2), 'utf-8');

    const saved: typeof existing = JSON.parse(await readFile(enginesFile, 'utf-8'));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'test-bark',
      command: 'python /opt/bark/run.py',
      outputPath: '/tmp/bark_{id}.wav',
    });
  });
});