// packages/onyx-compute/src/tests/router.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCompute } from '../router.js';

// We mock fetch globally so tests don't hit real network
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

afterEach(() => {
  vi.resetAllMocks();
  delete process.env.NOMAD_MODE;
  delete process.env.NOSANA_PRIVATE_KEY;
});

describe('getCompute router', () => {
  it('returns "edge" when NOMAD_MODE=true (no network calls)', async () => {
    process.env.NOMAD_MODE = 'true';
    const result = await getCompute();
    expect(result).toBe('edge');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns "nosana" when NOSANA_PRIVATE_KEY is set and Ollama/LMStudio are not running', async () => {
    process.env.NOSANA_PRIVATE_KEY = 'fake-key-for-test';
    // Both probes fail (network unreachable)
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await getCompute();
    expect(result).toBe('nosana');
  });

  it('returns "local-ollama" when Ollama responds OK', async () => {
    // First fetch call (Ollama) succeeds, so we return early
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await getCompute();
    expect(result).toBe('local-ollama');
  });

  it('returns "local-lmstudio" when Ollama fails but LM Studio responds OK', async () => {
    // Ollama probe fails
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    // LM Studio probe succeeds
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await getCompute();
    expect(result).toBe('local-lmstudio');
  });

  it('throws when no compute is available', async () => {
    // All probes fail, no env vars set
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(getCompute()).rejects.toThrow(
      'No compute available'
    );
  });
});