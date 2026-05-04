// ─────────────────────────────────────────────
// Test 2: compress.ts — crystal token budget
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { ConversationTelemetry } from '../types.js';
import { MEMORY_CRYSTAL_MAX_TOKENS } from '../constants.js';

// ── Mock fetch before importing compress ─────────────────────────────────────

const MOCK_COMPRESSION_RESPONSE = {
  decisions: ['Use Bun over Node for runtime performance'],
  facts: ['Bun SQLite is faster than better-sqlite3 by 3x'],
  preferences: ['User prefers TypeScript strict mode always on'],
  errors: ['Missing ANTHROPIC_API_KEY caused auth failure on first run'],
};

globalThis.fetch = vi.fn(async (_url: string, _init?: RequestInit) => {
  return new Response(
    JSON.stringify({
      content: [
        {
          type: 'text',
          text: JSON.stringify(MOCK_COMPRESSION_RESPONSE),
        },
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}) as typeof fetch;

// Set required env var before importing compress.
process.env['ANTHROPIC_API_KEY'] = 'test-key-abc123';

// ── Import after mocks ───────────────────────────────────────────────────────

const { compress } = await import('../compress.js');

// ── Tests ────────────────────────────────────────────────────────────────────

describe('compress — crystal token budget', () => {
  const makeBuffer = (count: number): ConversationTelemetry[] => {
    return Array.from({ length: count }, (_, i) => ({
      sessionId: 'test-session-compress',
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `This is turn ${i} with some content about Solana and Bun runtime.`,
      tokenCount: 15,
      timestamp: Date.now() + i * 1000,
    }));
  };

  it('returns a crystal with compressedTokenCount < MEMORY_CRYSTAL_MAX_TOKENS', async () => {
    const buffer = makeBuffer(10);
    const crystal = await compress('test-session-compress', buffer, 'code--ts');

    expect(crystal.compressedTokenCount).toBeLessThan(MEMORY_CRYSTAL_MAX_TOKENS);
  });

  it('populates all four arrays from Claude response', async () => {
    const buffer = makeBuffer(5);
    const crystal = await compress('test-session-compress', buffer, 'code--ts');

    expect(crystal.decisions.length).toBeGreaterThan(0);
    expect(crystal.facts.length).toBeGreaterThan(0);
    expect(crystal.preferences.length).toBeGreaterThan(0);
    expect(crystal.errors.length).toBeGreaterThan(0);
  });

  it('returns empty crystal for empty buffer without calling API', async () => {
    const callsBefore = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    const crystal = await compress('empty-session', [], 'finance');

    expect(crystal.decisions).toEqual([]);
    expect(crystal.facts).toEqual([]);
    expect(crystal.rawTokenCount).toBe(0);
    expect(crystal.compressedTokenCount).toBe(0);

    const callsAfter = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callsAfter).toBe(callsBefore); // No API call made.
  });

  it('includes sessionId and mode in the crystal', async () => {
    const buffer = makeBuffer(3);
    const crystal = await compress('my-session-123', buffer, 'trading');

    expect(crystal.sessionId).toBe('my-session-123');
    expect(crystal.mode).toBe('trading');
    expect(typeof crystal.id).toBe('string');
    expect(crystal.id.length).toBeGreaterThan(0);
  });
});