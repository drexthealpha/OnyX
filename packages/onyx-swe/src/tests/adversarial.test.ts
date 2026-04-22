/**
 * Test 3: Adversarial loop returns passed: true for syntactically correct code.
 *
 * Tests that clean, simple code passes the adversarial review.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@onyx/mem', () => ({
  store: vi.fn().mockResolvedValue(undefined),
  retrieve: vi.fn().mockResolvedValue([]),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const CLEAN_CODE = `
export function add(a: number, b: number): number {
  return a + b;
}

export function greet(name: string): string {
  if (!name || name.trim() === '') {
    throw new Error('Name cannot be empty');
  }
  return \`Hello, \${name.trim()}!\`;
}
`.trim();

describe('adversarialTest', () => {
  beforeEach(() => {
    process.env['ANTHROPIC_API_KEY'] = 'test-api-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env['ANTHROPIC_API_KEY'];
  });

  it('returns passed: true for syntactically correct, safe code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              issues: [],
              passed: true,
              summary: 'No security issues or bugs found. Code is clean and well-structured.',
            }),
          },
        ],
      }),
    } as Response);

    const { adversarialTest } = await import('../archon/adversarial-loop.js');
    const result = await adversarialTest(CLEAN_CODE, 'unit test — clean helper functions');

    expect(result).toBeDefined();
    expect(result.issues).toBeInstanceOf(Array);
    expect(result.issues).toHaveLength(0);
    expect(result.passed).toBe(true);
  });

  it('returns passed: false when Claude finds security issues', async () => {
    process.env['ANTHROPIC_API_KEY'] = 'test-api-key';
    
    const VULNERABLE_CODE = `
      export function query(userInput: string) {
        return eval(userInput);
      }
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              issues: [
                {
                  type: 'security',
                  severity: 'critical',
                  description: 'Use of eval() with unsanitized user input enables arbitrary code execution',
                  location: 'query function',
                  recommendation: 'Remove eval() and use a safe alternative',
                },
              ],
              passed: false,
              summary: 'Critical security vulnerability found: eval() with user input',
            }),
          },
        ],
      }),
    } as Response);

    const { adversarialTest } = await import('../archon/adversarial-loop.js');
    const result = await adversarialTest(VULNERABLE_CODE, 'unit test — vulnerable code');

    expect(result.passed).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]).toContain('CRITICAL');
  });

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env['ANTHROPIC_API_KEY'];

    const { adversarialTest } = await import('../archon/adversarial-loop.js');
    await expect(adversarialTest('const x = 1;')).rejects.toThrow('ANTHROPIC_API_KEY');
  });
});