/**
 * Bull researcher — makes the strongest case FOR buying
 * Uses Claude API (user's ANTHROPIC_API_KEY)
 */

import Anthropic from '@anthropic-ai/sdk';
import { MarketAnalysis, ResearchReport } from '../types.js';

interface ContentBlock {
  type: 'text';
  text: string;
}

const SYSTEM_PROMPT = `You are an optimistic crypto analyst with a bullish disposition.
Your job is to make the strongest possible case for buying a given token.
Review the market analysis data and build a compelling bull thesis.
Return ONLY valid JSON matching exactly this schema:
{
  "thesis": string (1-2 sentence core bull argument),
  "supportingPoints": string[] (3-5 specific supporting points with data references),
  "risks": string[] (1-2 risks to acknowledge — even bulls acknowledge risks),
  "confidence": number (0.0 to 1.0, your conviction in the bull case)
}
Be specific. Reference the indicator values. No vague platitudes.`;

export async function research(analysis: MarketAnalysis): Promise<ResearchReport> {
  const key = process.env['ANTHROPIC_API_KEY'];
  if (!key) throw new Error('ANTHROPIC_API_KEY env var not set');
  const client = new Anthropic({ apiKey: key });

  const prompt = `Token: ${analysis.token}
Current Price: $${analysis.price.toFixed(6)}
Market Signal: ${analysis.signal} (confidence: ${(analysis.confidence * 100).toFixed(1)}%)

Technical Indicators:
- RSI(14): ${analysis.indicators.rsi14.toFixed(2)}
- MACD: ${analysis.indicators.macd.toFixed(6)} | Signal: ${analysis.indicators.macdSignal.toFixed(6)} | Histogram: ${analysis.indicators.macdHistogram.toFixed(6)}
- SMA(20): $${analysis.indicators.sma20.toFixed(6)}
- EMA(9): $${analysis.indicators.ema9.toFixed(6)}
- Bollinger Bands: Upper $${analysis.indicators.bbUpper.toFixed(6)} | Middle $${analysis.indicators.bbMiddle.toFixed(6)} | Lower $${analysis.indicators.bbLower.toFixed(6)}
- Price vs SMA20: ${((analysis.price / analysis.indicators.sma20 - 1) * 100).toFixed(2)}%

Make the strongest case for BUYING this token right now.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 768,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content.find((b: unknown) => (b as ContentBlock).type === 'text') as ContentBlock | undefined)?.text;
  if (!text) {
    throw new Error('Bull researcher: No text content in AI response');
  }

  const parsed: { thesis: string; supportingPoints: string[]; risks: string[]; confidence: number } = JSON.parse(text);

  return {
    thesis: parsed.thesis,
    supportingPoints: parsed.supportingPoints,
    risks: parsed.risks,
    confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
    stance: 'BULL',
  };
}