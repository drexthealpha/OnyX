import Anthropic from '@anthropic-ai/sdk';
import { runAllSources } from '@onyx/intel';
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

  // 1. Fetch real-world intel first
  const sources = await runAllSources(`${token} crypto news`);
  const intelData = sources.map((s, i) => `[Source ${i+1}]: ${s.title}\n${s.snippet}`).join('\n\n');

  const systemPrompt = `You are a crypto news sentiment analyst. 
Use the provided real-time INTEL SOURCES to analyze the market sentiment for the token.
If no sources are provided or they are irrelevant, state that clearly and be neutral.
Do NOT hallucinate events that are not in the sources.

Return ONLY valid JSON matching this schema:
{
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "score": number between -1 (very bearish) and 1 (very bullish),
  "headlines": string[] of 3-5 specific headlines found in the sources,
  "summary": string brief 2-sentence summary of the narrative supported by sources
}`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `INTEL SOURCES:\n${intelData}\n\nAnalyze news sentiment for token: ${token}.`,
      },
    ],
  });

  const text = (message.content.find((b: unknown) => (b as ContentBlock).type === 'text') as ContentBlock | undefined)?.text ?? '{}';

  let parsed: { sentiment: string; score: number; headlines: string[]; summary: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { sentiment: 'NEUTRAL', score: 0, headlines: [], summary: 'Unable to parse grounded sentiment.' };
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