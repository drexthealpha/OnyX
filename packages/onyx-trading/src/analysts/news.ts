/**
 * News sentiment analyst — uses Claude API (user's ANTHROPIC_API_KEY)
 * Operator cost: $0
 */

import Anthropic from '@anthropic-ai/sdk';
import { NewsAnalysis } from '../types.js';

interface ContentBlock {
  type: 'text';
  text: string;
}

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY env var not set');
  return new Anthropic({ apiKey: key });
}

export async function analyzeNews(token: string): Promise<NewsAnalysis> {
  const client = getClient();

  const systemPrompt = `You are a crypto news sentiment analyst. Given a token symbol or mint address,
analyze its recent market sentiment based on your knowledge. Return ONLY valid JSON matching this schema:
{
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "score": number between -1 (very bearish) and 1 (very bullish),
  "headlines": string[] of 3-5 representative recent headlines or events (synthesized),
  "summary": string brief 2-sentence summary of market narrative
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze news sentiment for token: ${token}. Today's date: ${new Date().toISOString().split('T')[0]}.`,
      },
    ],
  });

  const text = (message.content.find((b: unknown) => (b as ContentBlock).type === 'text') as ContentBlock | undefined)?.text ?? '{}';

  let parsed: { sentiment: string; score: number; headlines: string[]; summary: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { sentiment: 'NEUTRAL', score: 0, headlines: [], summary: 'Unable to parse sentiment.' };
  }

  const validSentiments = ['BULLISH', 'BEARISH', 'NEUTRAL'] as const;
  const sentiment = validSentiments.includes(parsed.sentiment as 'BULLISH' | 'BEARISH' | 'NEUTRAL')
    ? (parsed.sentiment as 'BULLISH' | 'BEARISH' | 'NEUTRAL')
    : 'NEUTRAL';

  return {
    token,
    sentiment,
    score: Math.max(-1, Math.min(1, parsed.score ?? 0)),
    headlines: parsed.headlines ?? [],
    summary: parsed.summary ?? '',
    timestamp: Date.now(),
  };
}