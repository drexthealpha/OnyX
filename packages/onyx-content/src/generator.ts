/**
 * generator.ts — Claude-powered content generation
 * Zero operator cost. ANTHROPIC_API_KEY is user-provided.
 */

import type { Content, ContentType } from './types.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  blog: 'Write a comprehensive blog post. Use H2 subheadings. 800-1200 words. Return only the blog post content with markdown formatting.',
  'twitter-thread':
    'Write a 10-tweet thread. Each tweet max 280 chars. Start with hook. Number each tweet like "1/" through "10/". Separate tweets with a blank line.',
  'youtube-script':
    'Write a 5-minute video script with intro, 3 main points, outro. Label each section clearly. No stage directions. Approx 700-800 words.',
  linkedin:
    'Write a professional LinkedIn post. 150-300 words. Use line breaks for readability. End with a question to drive engagement.',
};

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in environment');

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
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text block in Claude response');
  return textBlock.text.trim();
}

function parseTwitterThread(body: string): string[] {
  const rawTweets = body
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  return rawTweets.map((tweet) => (tweet.length > 280 ? tweet.slice(0, 277) + '…' : tweet));
}

export async function generateContent(topic: string, type: ContentType): Promise<Content> {
  const systemPrompt = SYSTEM_PROMPTS[type];
  const userPrompt = `Topic: ${topic}`;

  const body = await callClaude(systemPrompt, userPrompt);

  const wordCount = body.split(/\s+/).filter(Boolean).length;

  const content: Content = {
    type,
    topic,
    body,
    wordCount,
    generatedAt: Date.now(),
  };

  if (type === 'twitter-thread') {
    content.tweets = parseTwitterThread(body);
  }

  return content;
}