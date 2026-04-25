/**
 * crosspost.ts — Reformat content for multiple platforms and post
 * Zero operator cost. ANTHROPIC_API_KEY is user-provided.
 */

import type { CrosspostPlatform } from './types.js';
import { postThread } from './social.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const REFORMAT_PROMPTS: Record<CrosspostPlatform, string> = {
  blog:
    'Reformat this content as a comprehensive blog post. Use H2 subheadings. 800-1200 words. Return markdown.',
  twitter:
    'Reformat this content as a 10-tweet Twitter thread. Each tweet max 280 chars. Number tweets 1/ through 10/. Separate with blank lines.',
  linkedin:
    'Reformat this content as a professional LinkedIn post. 150-300 words. Use line breaks. End with an engagement question.',
};

async function reformatForPlatform(content: string, platform: CrosspostPlatform): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: REFORMAT_PROMPTS[platform],
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text in Claude response');
  return textBlock.text.trim();
}

export async function crosspost(
  content: string,
  platforms: CrosspostPlatform[],
): Promise<Record<CrosspostPlatform, string>> {
  const results: Partial<Record<CrosspostPlatform, string>> = {};

  for (const platform of platforms) {
    const reformatted = await reformatForPlatform(content, platform);
    results[platform] = reformatted;

    if (platform === 'twitter' && process.env.TWITTER_API_KEY) {
      const tweets = reformatted
        .split(/\n\s*\n/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.length > 280 ? t.slice(0, 277) + '…' : t));

      await postThread(tweets).catch((err) => {
        console.warn(`[crosspost] Twitter post failed: ${err.message}`);
      });
    }
  }

  return results as Record<CrosspostPlatform, string>;
}