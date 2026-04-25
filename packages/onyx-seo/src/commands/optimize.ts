// ============================================================
// packages/onyx-seo/src/commands/optimize.ts
// optimize(article) — final SEO audit + score pass
// ============================================================

import type { Article } from "../types.js";
import { createSEOOptimizer } from "../agents/seo-optimizer.js";
import { createContentAnalyzer } from "../agents/content-analyzer.js";
import { createCROAnalyst } from "../agents/cro-analyst.js";

export interface OptimizationReport {
  seoScore: number;
  contentScore: number;
  croScore: number;
  criticalFixes: string[];
  quickWins: string[];
  publishingReady: boolean;
  optimizedArticle: Article;
}

/**
 * Runs a final optimization pass on an article.
 * Runs SEO Optimizer + Content Analyzer + CRO Analyst in parallel.
 *
 * @param article - The article to optimize
 * @returns OptimizationReport with scores, fixes, and optimized article
 */
export async function optimize(
  article: Article
): Promise<OptimizationReport> {
  const articleText = `
Title: ${article.title}
Meta Description: ${article.metaDescription}
Keywords: ${article.keywords.join(", ")}

CONTENT:
${article.content}
  `.trim();

  const [seoOutput, contentOutput, croOutput] = await Promise.all([
    createSEOOptimizer().execute(
      `Perform final SEO optimization audit on this article:\n\n${articleText}`
    ),
    createContentAnalyzer().execute(
      `Perform final content quality analysis on this article:\n\n${articleText}`
    ),
    createCROAnalyst().execute(
      `Perform CRO analysis on this article's content and CTAs:\n\n${articleText}`
    ),
  ]);

  const seoScoreMatch = seoOutput.match(/SEO\s+(?:Optimization\s+)?Score[:\s]+(\d+)/i);
  const contentScoreMatch = contentOutput.match(/(?:Overall\s+)?(?:SEO|Content)\s+(?:Quality\s+)?(?:Score|Rating)[:\s]+(\d+)/i);
  const croScoreMatch = croOutput.match(/(?:Overall\s+)?CRO\s+Score[:\s]+(\d+)/i);

  const seoScore = seoScoreMatch ? parseInt(seoScoreMatch[1]) : 70;
  const contentScore = contentScoreMatch ? parseInt(contentScoreMatch[1]) : 70;
  const croScore = croScoreMatch ? parseInt(croScoreMatch[1]) : 70;

  const criticalFixes: string[] = [];
  const criticalSection = seoOutput.match(
    /Critical Issues[^]*?(?=Quick Wins|Strategic|$)/i
  );
  if (criticalSection) {
    const fixes = criticalSection[0].match(/\d+\.\s+([^\n]+)/g) ?? [];
    criticalFixes.push(...fixes.map((f) => f.replace(/^\d+\.\s+/, "").trim()));
  }

  const quickWins: string[] = [];
  const qwSection = seoOutput.match(/Quick Wins[^]*?(?=Strategic|Final|$)/i);
  if (qwSection) {
    const wins = qwSection[0].match(/\d+\.\s+([^\n]+)/g) ?? [];
    quickWins.push(...wins.map((w) => w.replace(/^\d+\.\s+/, "").trim()));
  }

  const publishingReady =
    seoScore >= 70 && contentScore >= 70 && criticalFixes.length === 0;

  return {
    seoScore,
    contentScore,
    croScore,
    criticalFixes: criticalFixes.slice(0, 5),
    quickWins: quickWins.slice(0, 5),
    publishingReady,
    optimizedArticle: article,
  };
}