// ============================================================
// packages/onyx-seo/src/commands/rewrite.ts
// rewrite(existingContent, topic) — refreshes existing content
// ============================================================

import type { Article } from "../types.js";
import { createContentAnalyzer } from "../agents/content-analyzer.js";
import { createEditor } from "../agents/editor.js";
import { createSEOOptimizer } from "../agents/seo-optimizer.js";
import { createMetaCreator } from "../agents/meta-creator.js";
import { createKeywordMapper } from "../agents/keyword-mapper.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

async function callAnthropic(
  userMessage: string,
  maxTokens = 8000,
  systemPrompt?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in environment");
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: userMessage }],
  };
  if (systemPrompt) body.system = systemPrompt;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };
  const textBlock = data.content?.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Rewrites and updates existing content.
 *
 * @param existingContent - The current article text
 * @param topic - The topic/keyword to optimize for
 * @returns Updated Article
 */
export async function rewrite(
  existingContent: string,
  topic: string
): Promise<Article> {
  const analyzer = createContentAnalyzer();
  const analysis = await analyzer.execute(
    `Analyze this existing article and identify gaps, outdated information, and improvement opportunities:

Topic: ${topic}

EXISTING CONTENT:
${existingContent}

Provide: content health score, quick wins, strategic improvements, and rewrite priority.`
  );

  const kwMapper = createKeywordMapper();
  const kwMap = await kwMapper.execute(
    `Map keyword optimization for this topic: ${topic}

Existing content summary:
${existingContent.slice(0, 800)}

Content Analysis:
${analysis.slice(0, 600)}

Provide updated keyword placement strategy.`
  );

  const editor = createEditor();
  const rewritten = await editor.execute(
    `Rewrite and update this article based on the analysis. Preserve what works, improve what doesn't, add what's missing:

Topic: ${topic}
Analysis: ${analysis.slice(0, 800)}
Keyword Strategy: ${kwMap.slice(0, 600)}

ORIGINAL ARTICLE:
${existingContent}

Return the FULL rewritten article with all improvements applied.`
  );

  const seoOptimizer = createSEOOptimizer();
  await seoOptimizer.execute(
    `Analyze and optimize this rewritten article for SEO:
Topic: ${topic}
${rewritten}`
  );

  const metaCreator = createMetaCreator();
  const metaOutput = await metaCreator.execute(
    `Create meta title and description for this updated article:
Topic: ${topic}
Article summary: ${rewritten.slice(0, 500)}`
  );

  const titleMatch = metaOutput.match(/Title:\s*([^\n]+)/i);
  const descMatch = metaOutput.match(/Description:\s*([^\n]+)/i);

  return {
    title: titleMatch?.[1]?.trim() ?? `${topic}: Updated Guide`,
    metaDescription:
      descMatch?.[1]?.trim().slice(0, 160) ??
      `Updated guide on ${topic} with latest insights and strategies.`,
    content: rewritten.length > existingContent.length * 0.3
      ? rewritten
      : existingContent,
    keywords: [topic],
    headlineVariants: [],
  };
}