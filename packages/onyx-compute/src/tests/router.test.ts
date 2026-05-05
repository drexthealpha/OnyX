// packages/onyx-compute/src/tests/router.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCompute } from '../router.js';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

afterEach(() => {
  vi.resetAllMocks();
  delete process.env.NOMAD_MODE;
  delete process.env.NOSANA_PRIVATE_KEY;
  delete process.env.QVAC_MODEL_PATH;
});

describe('getCompute router', () => {
  it('returns "edge" when NOMAD_MODE=true (no network calls)', async () => {
    process.env.NOMAD_MODE = 'true';
    const result = await getCompute();
    expect(result).toBe('edge');
  }, 30000);

  it('returns "nosana" when NOSANA_PRIVATE_KEY is set and Ollama/LMStudio are not running', async () => {
    process.env.NOSANA_PRIVATE_KEY = 'fake-key-for-test';
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await getCompute();
    expect(result).toBe('nosana');
  }, 30000);

  it('returns "local-ollama" when Ollama responds OK', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await getCompute();
    expect(result).toBe('local-ollama');
  }, 30000);

  it('returns "local-lmstudio" when Ollama fails but LM Studio responds OK', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await getCompute();
    expect(result).toBe('local-lmstudio');
  }, 30000);

  it('throws when no compute is available', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(getCompute()).rejects.toThrow(
      'No compute available'
    );
  }, 30000);
});