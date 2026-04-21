/**
 * Unit tests for onyx-semantic.
 *
 * NODE_ENV=test is set automatically by vitest.
 * embed() returns a deterministic mock vector — no Qdrant docker required.
 * Qdrant HTTP calls are mocked with vi.mock.
 *
 * Tests:
 *   1. upsert then get returns same payload
 *   2. search returns array of max topK results
 *   3. Recency decay scores 1-hour-old content higher than 100-hour-old content
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock @qdrant/js-client-rest ──────────────────────────────────────────────

const store = new Map<string, { vector: number[]; payload: Record<string, unknown> }>();

const mockClient = {
  collectionExists: vi.fn().mockResolvedValue({ exists: true }),
  createCollection: vi.fn().mockResolvedValue({}),
  upsert: vi.fn().mockImplementation(
    async (_col: string, args: { points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }> }) => {
      for (const pt of args.points) {
        store.set(pt.id, { vector: pt.vector, payload: pt.payload });
      }
      return { status: 'ok' };
    },
  ),
  delete: vi.fn().mockImplementation(async (_col: string, sel: { points: string[] }) => {
    for (const id of sel.points) store.delete(id);
    return { status: 'ok' };
  }),
  retrieve: vi.fn().mockImplementation(async (_col: string, args: { ids: string[] }) => {
    return args.ids
      .map((id) => store.get(id))
      .filter(Boolean)
      .map((entry, i) => ({ id: args.ids[i], payload: entry!.payload }));
  }),
  search: vi.fn().mockImplementation(
    async (
      _col: string,
      args: { vector: number[]; limit: number },
    ) => {
      const all = [...store.values()].slice(0, args.limit);
      return all.map((entry, i) => ({
        id: `point-${i}`,
        score: 0.9,
        payload: entry.payload,
      }));
    },
  ),
};

vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: vi.fn(() => mockClient),
}));

// ─── Imports (after mock) ─────────────────────────────────────────────────────

import { createSemanticClient } from '../client.js';
import { search } from '../search.js';
import { embed } from '../embed.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('onyx-semantic', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    mockClient.collectionExists.mockResolvedValue({ exists: true });
    mockClient.upsert.mockImplementation(
      async (_col: string, args: { points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }> }) => {
        for (const pt of args.points) {
          store.set(pt.id, { vector: pt.vector, payload: pt.payload });
        }
        return { status: 'ok' };
      },
    );
    mockClient.retrieve.mockImplementation(async (_col: string, args: { ids: string[] }) => {
      return args.ids
        .map((id) => store.get(id))
        .filter(Boolean)
        .map((entry, i) => ({ id: args.ids[i], payload: entry!.payload }));
    });
    mockClient.search.mockImplementation(
      async (_col: string, args: { vector: number[]; limit: number }) => {
        const all = [...store.values()].slice(0, args.limit);
        return all.map((entry, i) => ({
          id: `point-${i}`,
          score: 0.9,
          payload: entry.payload,
        }));
      },
    );
    mockClient.delete.mockImplementation(async (_col: string, sel: { points: string[] }) => {
      for (const id of sel.points) store.delete(id);
      return { status: 'ok' };
    });
  });

  it('upsert then get returns same payload', async () => {
    const sem = createSemanticClient();

    const payload = {
      timestamp: Date.now(),
      source: 'test',
      importance: 0.8,
      tags: ['unit-test'],
    };

    await sem.memories.upsert([
      {
        id: 'mem-001',
        text: 'The ONYX kernel enforces Apollo-11 laws',
        payload,
      },
    ]);

    const result = await sem.memories.get('mem-001');

    expect(result).toBeDefined();
    expect((result as typeof payload).source).toBe('test');
    expect((result as typeof payload).importance).toBe(0.8);
    expect((result as typeof payload).tags).toEqual(['unit-test']);
  });

  it('search returns array of at most topK results', async () => {
    for (let i = 0; i < 8; i++) {
      store.set(`p-${i}`, {
        vector: Array.from(await embed(`content ${i}`)),
        payload: { timestamp: Date.now(), source: 'seed' },
      });
    }

    const topK = 3;
    const results = await search('find something', 'onyx_memories', topK);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(topK);
  });

  it('recency decay scores 1-hour-old content higher than 100-hour-old content', async () => {
    const NOW = Date.now();
    const oneHourAgo = NOW - 1 * 60 * 60 * 1000;
    const hundredHoursAgo = NOW - 100 * 60 * 60 * 1000;

    store.set('recent', {
      vector: Array.from(await embed('recent knowledge')),
      payload: { timestamp: oneHourAgo, source: 'test' },
    });
    store.set('old', {
      vector: Array.from(await embed('old knowledge')),
      payload: { timestamp: hundredHoursAgo, source: 'test' },
    });

    mockClient.search.mockResolvedValueOnce([
      { id: 'recent', score: 0.9, payload: { timestamp: oneHourAgo, source: 'test' } },
      { id: 'old',    score: 0.9, payload: { timestamp: hundredHoursAgo, source: 'test' } },
    ]);

    const results = await search('knowledge', 'onyx_memories', 5);

    expect(results.length).toBeGreaterThanOrEqual(2);

    const recentResult = results.find((r) => r.id === 'recent');
    const oldResult    = results.find((r) => r.id === 'old');

    expect(recentResult).toBeDefined();
    expect(oldResult).toBeDefined();
    expect(recentResult!.score).toBeGreaterThan(oldResult!.score);
  });
});