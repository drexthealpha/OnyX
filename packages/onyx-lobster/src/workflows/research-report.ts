import { Pipeline } from '../pipeline.js';

export async function runResearch(topic: string): Promise<void> {
  const pipeline = new Pipeline()
    .step('research-graph', async (_input) => {
      const research = await import('@onyx/research');
      const state = await research.runResearch(topic);
      return state;
    })
    .step('convert-to-podcast', async (input) => {
      const research = await import('@onyx/research');
      const state = input as Record<string, unknown>;
      const podcastScript = await (research as any).toPodcastScript?.(state.report, state) ?? 'Podcast script unavailable';
      return { state: input, podcastScript };
    })
    .step('crosspost-summary', async (input) => {
      const { state } = input as { state: Record<string, unknown>; podcastScript: string };
      const content = await import('@onyx/content');
      const summary = String(state.report ?? topic);
      await content.crosspost(summary, ['twitter-thread', 'linkedin']);
      return { topic, done: true };
    });

  const result = await pipeline.run(topic);
  if (!result.success) {
    throw new Error(`Research pipeline failed: ${JSON.stringify(result.steps.filter(s => !s.success))}`);
  }
}