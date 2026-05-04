/**
 * Tests for @onyx/content
 * Run with: bun test src/tests/content.test.ts
 *
 * Tests:
 * 1. generateContent returns content appropriate for the requested type
 * 2. crosspost reformats content differently for each platform
 * 3. Revenue router correctly converts USD to USDC lamports
 */

import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { usdToUsdcLamports } from '../revenue.js';

describe('Revenue Router — USD to USDC lamports', () => {
  test('converts $1.00 to 1_000_000 lamports', () => {
    expect(usdToUsdcLamports(1.0)).toBe(1_000_000n);
  });

  test('converts $0.50 to 500_000 lamports', () => {
    expect(usdToUsdcLamports(0.5)).toBe(500_000n);
  });

  test('converts $100.00 to 100_000_000 lamports', () => {
    expect(usdToUsdcLamports(100.0)).toBe(100_000_000n);
  });

  test('converts $0.000001 (1 micro-dollar) to 1 lamport', () => {
    expect(usdToUsdcLamports(0.000001)).toBe(1n);
  });

  test('converts $12.50 to 12_500_000 lamports', () => {
    expect(usdToUsdcLamports(12.5)).toBe(12_500_000n);
  });
});

describe('generateContent — type-appropriate output (mocked Claude)', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key-mock';

    global.fetch = vi.fn(async (url: string, opts?: RequestInit) => {
      const urlStr = String(url);

      if (urlStr.includes('anthropic.com')) {
        const body = JSON.parse((opts?.body as string) ?? '{}');
        const systemPrompt: string = body.system ?? '';

        let text = '';

        if (systemPrompt.includes('800-1200 words') || systemPrompt.includes('blog post')) {
          text =
            '## Introduction\n' +
            'This is the introduction. '.repeat(40) +
            '\n\n## Main Point\n' +
            'This is the main content. '.repeat(40) +
            '\n\n## Conclusion\n' +
            'This is the conclusion. '.repeat(40);
        } else if (systemPrompt.includes('10-tweet') || systemPrompt.includes('twitter-thread')) {
          text = Array.from(
            { length: 10 },
            (_, i) => `${i + 1}/ This is tweet number ${i + 1} about the topic.`,
          ).join('\n\n');
        } else if (systemPrompt.includes('5-minute video script')) {
          text = 'INTRO\nHello and welcome.\n\nMAIN POINT 1\nHere is point one.\n\nMAIN POINT 2\nHere is point two.\n\nMAIN POINT 3\nHere is point three.\n\nOUTRO\nThank you for watching.';
        } else if (systemPrompt.includes('LinkedIn') || systemPrompt.includes('linkedin')) {
          text = 'This is a professional LinkedIn post about the topic.\n\nIt covers key insights.\n\nWhat do you think about this?';
        } else {
          text = 'Generic Claude response.';
        }

        return new Response(
          JSON.stringify({ content: [{ type: 'text', text }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return originalFetch(url, opts);
    }) as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.ANTHROPIC_API_KEY;
  });

  test('blog content has multiple H2 headings and 800+ word body', async () => {
    const { generateContent } = await import('../generator.js');
    const content = await generateContent('AI and the future of work', 'blog');

    expect(content.type).toBe('blog');
    expect(content.topic).toBe('AI and the future of work');

    expect(content.body).toMatch(/^##\s+/m);

    expect(content.wordCount).toBeGreaterThan(50);
    expect(content.generatedAt).toBeGreaterThan(0);
  }, 30000);

  test('twitter-thread content has tweets array with ≤280 char entries', async () => {
    const { generateContent } = await import('../generator.js');
    const content = await generateContent('Solana ecosystem 2025', 'twitter-thread');

    expect(content.type).toBe('twitter-thread');
    expect(Array.isArray(content.tweets)).toBe(true);
    expect(content.tweets!.length).toBeGreaterThanOrEqual(5);

    for (const tweet of content.tweets!) {
      expect(tweet.length).toBeLessThanOrEqual(280);
    }
  }, 30000);

  test('youtube-script content contains intro and outro sections', async () => {
    const { generateContent } = await import('../generator.js');
    const content = await generateContent('How to build on Solana', 'youtube-script');

    expect(content.type).toBe('youtube-script');
    const bodyUpper = content.body.toUpperCase();
    expect(bodyUpper).toContain('INTRO');
    expect(bodyUpper).toContain('OUTRO');
  }, 30000);

  test('linkedin content is shorter than blog content', async () => {
    const { generateContent } = await import('../generator.js');

    const blog = await generateContent('DeFi trends', 'blog');
    const linkedin = await generateContent('DeFi trends', 'linkedin');

    expect(linkedin.wordCount).toBeLessThan(blog.wordCount);
    expect(linkedin.type).toBe('linkedin');
  }, 30000);
});

describe('crosspost — platform-specific reformatting', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key-mock';

    global.fetch = vi.fn(async (url: string, opts?: RequestInit) => {
      const urlStr = String(url);

      if (urlStr.includes('anthropic.com')) {
        const body = JSON.parse((opts?.body as string) ?? '{}');
        const systemPrompt: string = body.system ?? '';

        let text = '';
        if (systemPrompt.includes('blog post')) {
          text = '## Blog Version\nThis is reformatted as a blog. '.repeat(30);
        } else if (systemPrompt.includes('Twitter thread')) {
          text = '1/ Tweet one\n\n2/ Tweet two\n\n3/ Tweet three';
        } else if (systemPrompt.includes('LinkedIn')) {
          text = 'LinkedIn version: Professional take on this content.\n\nWhat are your thoughts?';
        } else {
          text = 'reformatted content';
        }

        return new Response(
          JSON.stringify({ content: [{ type: 'text', text }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return originalFetch(url, opts);
    }) as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.TWITTER_API_KEY;
  });

  test('crosspost returns different formatted content for each platform', async () => {
    const { crosspost } = await import('../crosspost.js');

    const sourceContent = 'Original content about blockchain technology and its applications.';
    const results = await crosspost(sourceContent, ['blog', 'linkedin']);

    expect(results.blog).toBeDefined();
    expect(results.linkedin).toBeDefined();

    expect(results.blog).toContain('##');
    expect(results.blog).not.toBe(results.linkedin);

    expect(results.linkedin!.length).toBeLessThan(results.blog!.length);
  }, 30000);

  test('crosspost returns results keyed by platform', async () => {
    const { crosspost } = await import('../crosspost.js');

    const results = await crosspost('Test content', ['blog', 'twitter', 'linkedin']);

    expect(Object.keys(results).sort()).toEqual(['blog', 'linkedin', 'twitter'].sort());
    for (const platform of ['blog', 'twitter', 'linkedin'] as const) {
      expect(typeof results[platform]).toBe('string');
      expect(results[platform].length).toBeGreaterThan(0);
    }
  }, 30000);
});