/**
 * Test 1: Planner returns plan with 3-5 steps when given a simple issue.
 *
 * Uses mock fetch to avoid real API/GitHub calls in unit tests.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// ── Mock fetch globally ────────────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock GitHub issue response
const mockIssue = {
  number: 42,
  title: 'Add rate limiting to the API gateway',
  body: 'The API gateway currently has no rate limiting. Add token bucket rate limiting per user.',
  html_url: 'https://github.com/test-owner/test-repo/issues/42',
  labels: [{ name: 'enhancement' }, { name: 'backend' }],
  user: { login: 'testuser' },
  created_at: '2025-01-01T00:00:00Z',
};

const mockComments: unknown[] = [];

// Mock Claude plan response
const mockPlan = {
  steps: [
    {
      description: 'Install rate limiting middleware dependency',
      filePaths: ['package.json'],
      expectedChanges: 'Add rate-limiter-flexible to dependencies',
    },
    {
      description: 'Create rate limiter configuration module',
      filePaths: ['src/middleware/rateLimiter.ts'],
      expectedChanges: 'Token bucket rate limiter with per-user limits',
    },
    {
      description: 'Integrate rate limiter into API gateway middleware stack',
      filePaths: ['src/gateway/index.ts'],
      expectedChanges: 'Apply rate limiting middleware before route handlers',
    },
    {
      description: 'Write unit tests for rate limiting',
      filePaths: ['src/middleware/rateLimiter.test.ts'],
      expectedChanges: 'Tests covering normal flow, rate exceeded, and reset behavior',
    },
  ],
  estimatedMinutes: 45,
};

describe('planFromIssue', () => {
  beforeAll(() => {
    process.env['GITHUB_TOKEN'] = 'test-github-token';
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
  });

  afterAll(() => {
    delete process.env['GITHUB_TOKEN'];
    delete process.env['ANTHROPIC_API_KEY'];
  });

  it('returns a plan with 3-5 steps when given a simple issue URL', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssue,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: JSON.stringify(mockPlan) }],
        }),
      } as Response);

    const { planFromIssue } = await import('../agent/planner.js');

    const plan = await planFromIssue('https://github.com/test-owner/test-repo/issues/42');

    expect(plan).toBeDefined();
    expect(plan.steps).toBeInstanceOf(Array);
    expect(plan.steps.length).toBeGreaterThanOrEqual(3);
    expect(plan.steps.length).toBeLessThanOrEqual(5);
    expect(plan.estimatedMinutes).toBeGreaterThan(0);

    // Verify step structure
    for (const step of plan.steps) {
      expect(step.description).toBeTruthy();
      expect(Array.isArray(step.filePaths)).toBe(true);
      expect(step.expectedChanges).toBeDefined();
    }
  });

  it('throws when GITHUB_TOKEN is missing', async () => {
    const savedToken = process.env['GITHUB_TOKEN'];
    delete process.env['GITHUB_TOKEN'];

    const { planFromIssue } = await import('../agent/planner.js');

    await expect(
      planFromIssue('https://github.com/owner/repo/issues/1'),
    ).rejects.toThrow('GITHUB_TOKEN');

    process.env['GITHUB_TOKEN'] = savedToken;
  });
});