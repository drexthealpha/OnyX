import { Pipeline } from '../pipeline.js';
import { webSearch } from '../stdlib/web-search.js';
import { llmInvoke } from '../stdlib/llm-invoke.js';

export interface TradeSignalResult {
  token: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
}

export async function runTradeSignal(token: string): Promise<TradeSignalResult> {
  const pipeline = new Pipeline()
    .step('gather-intel', async (_input) => {
      const brief = await webSearch(`${token} price prediction market analysis`);
      return { token, brief };
    })
    .step('trading-analysis', async (input) => {
      const { token: t, brief } = input as { token: string; brief: string };
      try {
        const trading = await import('@onyx/trading');
        const analysis = await (trading as any).runAnalysis?.(t) ?? { signal: 'HOLD', confidence: 0.5 };
        return { token: t, brief, analysis };
      } catch {
        return { token: t, brief, analysis: { signal: 'HOLD', confidence: 0.5 } };
      }
    })
    .step('synthesize-signal', async (input) => {
      const { token: t, brief, analysis } = input as { token: string; brief: string; analysis: unknown };
      const prompt = `Based on this market intel and analysis, provide a trade signal for ${t}.
Intel: ${brief}
Analysis: ${JSON.stringify(analysis)}

Respond in JSON: {"signal":"BUY"|"SELL"|"HOLD","confidence":0.0-1.0,"reasoning":"..."}`;
      const response = await llmInvoke(prompt);
      try {
        const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
        return { token: t, ...parsed };
      } catch {
        return { token: t, signal: 'HOLD' as const, confidence: 0.5, reasoning: response };
      }
    });

  const result = await pipeline.run(token);
  if (!result.success) throw new Error(`Trade signal pipeline failed for ${token}`);
  return result.output as TradeSignalResult;
}