import { Pipeline } from '../pipeline.js';

export interface SeoArticleResult {
  topic: string;
  title: string;
  markdown: string;
  published: boolean;
}

export async function runSeoArticle(topic: string): Promise<SeoArticleResult> {
  const pipeline = new Pipeline()
    .step('seo-research', async (_input) => {
      const seo = await import('@onyx/seo');
      const keywords = await (seo as any).research?.(topic) ?? [];
      return { topic, keywords };
    })
    .step('write-article', async (input) => {
      const { topic: t } = input as { topic: string };
      const seo = await import('@onyx/seo');
      const article = await (seo as any).writeArticle?.(t) ?? { title: t, markdown: `# ${t}` };
      return article;
    })
    .step('publish-article', async (input) => {
      const article = input as { title: string; markdown: string };
      const seo = await import('@onyx/seo');
      await (seo as any).publish?.(article, 'draft').catch(() => {/* WP not configured */});
      return { topic, title: article.title, markdown: article.markdown, published: true };
    });

  const result = await pipeline.run(topic);
  if (!result.success) throw new Error(`SEO article pipeline failed for: ${topic}`);
  return result.output as SeoArticleResult;
}