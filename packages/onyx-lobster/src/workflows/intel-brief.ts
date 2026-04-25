import { Pipeline } from '../pipeline.js';

export async function runIntelBrief(topic: string): Promise<void> {
  const pipeline = new Pipeline()
    .step('parallel-intel', async (_input) => {
      const intel = await import('@onyx/intel');
      const brief = await intel.runIntel(topic);
      return brief;
    })
    .step('synthesize-brief', async (input) => {
      const brief = input as { topic: string; brief: string; sources: unknown[]; confidence: number };
      const formatted = `# Intel Brief: ${brief.topic}\n\n${brief.brief}\n\nConfidence: ${(brief.confidence * 100).toFixed(1)}%\nSources: ${(brief.sources as unknown[]).length}`;
      return { topic: brief.topic, formatted, sources: brief.sources };
    })
    .step('send-webhook', async (input) => {
      const { topic: t, formatted } = input as { topic: string; formatted: string; sources: unknown[] };
      const gateway = await import('@onyx/gateway');
      await gateway.sendMessage('webhook', formatted);
      return { topic: t, sent: true };
    });

  const result = await pipeline.run(topic);
  if (!result.success) {
    throw new Error(`Intel brief failed for "${topic}": ${result.steps.find(s => !s.success)?.error}`);
  }
}