import { Pipeline } from '../pipeline.js';
import { llmInvoke } from '../stdlib/llm-invoke.js';

export interface ContentPublishOptions {
  topic: string;
  platforms: string[];
}

export async function runContentPublish(options: ContentPublishOptions): Promise<void> {
  const { topic, platforms } = options;

  const pipeline = new Pipeline()
    .step('generate-content', async (_input) => {
      const content = await import('@onyx/content');
      const generated = await (content as any).generateContent?.(topic, 'twitter-thread') ?? await llmInvoke(`Write a twitter thread about: ${topic}`);
      return { topic, content: typeof generated === 'string' ? generated : JSON.stringify(generated) };
    })
    .step('crosspost', async (input) => {
      const { content: text } = input as { topic: string; content: string };
      const contentPkg = await import('@onyx/content');
      await contentPkg.crosspost(text, platforms);
      return { topic, platforms, done: true };
    });

  const result = await pipeline.run(options);
  if (!result.success) throw new Error(`Content publish failed: ${result.steps.find(s => !s.success)?.error}`);
}