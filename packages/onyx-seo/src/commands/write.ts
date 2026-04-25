// ============================================================
// packages/onyx-seo/src/commands/write.ts
// writeArticle(topic) — full 8-agent SEO content pipeline
// Pipeline: research → content-analyzer → keyword-mapper → editor (draft)
//           → seo-optimizer → meta-creator → internal-linker → headline-generator
// Returns Article: { title, metaDescription, content, keywords, headlineVariants }
// ============================================================

import type { Article } from "../types.js";
import { research } from "./research.js";
import { createContentAnalyzer } from "../agents/content-analyzer.js";
import { createKeywordMapper } from "../agents/keyword-mapper.js";
import { createEditor } from "../agents/editor.js";
import { createSEOOptimizer } from "../agents/seo-optimizer.js";
import { createMetaCreator } from "../agents/meta-creator.js";
import { createInternalLinker } from "../agents/internal-linker.js";
import { createHeadlineGenerator } from "../agents/headline-generator.js";

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

function topKeywords(
  opps: Awaited<ReturnType<typeof research>>,
  n = 5
): string[] {
  return opps.slice(0, n).map((o) => o.keyword);
}

function parseHeadlines(raw: string): string[] {
  const lines = raw.split("\n");
  const headlines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:\d+\.|[-*•])\s+(.+)$/);
    if (match && match[1] && match[1].length > 10) {
      headlines.push(match[1].trim());
    }
  }
  return headlines.length > 0 ? headlines.slice(0, 10) : [raw.split("\n")[0]];
}

function parseKeywords(raw: string): string[] {
  const match = raw.match(/LSI Keywords Found:\s*([^\n]+)/i);
  if (match) {
    return match[1]
      .split(/[,;]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }
  return [];
}

function parseMetaDescription(raw: string): string {
  const match = raw.match(/RECOMMENDED.*?Description:\s*([^\n]+)/is);
  if (match) return match[1].trim();
  const descMatch = raw.match(/Description:\s*([^\n]+)/i);
  if (descMatch) return descMatch[1].trim().slice(0, 160);
  return "";
}

function parseTitle(raw: string): string {
  const match = raw.match(/RECOMMENDED.*?Title:\s*([^\n]+)/is);
  if (match) return match[1].trim();
  const titleMatch = raw.match(/Title:\s*([^\n]+)/i);
  if (titleMatch) return titleMatch[1].trim().slice(0, 60);
  return "";
}

/**
 * Full SEO article writing pipeline.
 * Calls 8 agents in sequence, each building on the last.
 *
 * @param topic - The article topic
 * @returns Article with title, metaDescription, content, keywords, headlineVariants
 */
export async function writeArticle(topic: string): Promise<Article> {
  const opportunities = await research(topic);
  const primaryKeyword = opportunities[0]?.keyword ?? topic;
  const topKws = topKeywords(opportunities);

  const researchContext = `
Topic: ${topic}
Primary Keyword: ${primaryKeyword}
Top Keywords by Opportunity Score:
${opportunities
  .slice(0, 7)
  .map((o) => `  - "${o.keyword}" (vol:${o.searchVolume}, comp:${o.competition.toFixed(2)}, score:${o.score.toFixed(1)})`)
  .join("\n")}
  `.trim();

  const contentAnalyzer = createContentAnalyzer();
  const analysisInput = `
Analyze content opportunities and create a detailed article brief for:
${researchContext}

Provide:
1. Recommended article structure (H1, H2s, H3s)
2. Search intent classification
3. Content requirements to outrank competitors
4. Minimum word count target
5. Key topics and subtopics to cover
  `.trim();
  const contentBrief = await contentAnalyzer.execute(analysisInput);

  const keywordMapper = createKeywordMapper();
  const kwMapInput = `
Create a keyword mapping strategy for this article:
${researchContext}

Content Brief:
${contentBrief}

Provide keyword placement map, density targets, LSI keywords, and semantic variations.
  `.trim();
  const kwMap = await keywordMapper.execute(kwMapInput);
  const keywords = parseKeywords(kwMap).length > 0
    ? parseKeywords(kwMap)
    : topKws;

  const draftPrompt = `
Write a comprehensive, SEO-optimized article based on this brief:

${contentBrief}

Keyword Strategy:
${kwMap}

Requirements:
- Topic: ${topic}
- Primary Keyword: ${primaryKeyword}
- Minimum 2,000 words
- H1/H2/H3 structure as outlined in brief
- Natural keyword integration per the keyword map
- Include introduction hook, problem, promise structure
- Practical actionable advice throughout
- Strong conclusion with clear CTA
- Write in active voice, 8th-10th grade reading level
  `.trim();

  const draftResult = await callAnthropic(
    draftPrompt,
    8000,
    "You are a professional SEO content writer. Write a comprehensive, engaging article."
  );

  const editor = createEditor();
  const editorInput = `
Edit this draft article to make it sound human, engaging, and authentic:

PRIMARY KEYWORD: ${primaryKeyword}

DRAFT:
${draftResult}

Apply all editorial principles: inject personality, remove robotic patterns, strengthen examples, improve flow.
Return the FULL rewritten article, not just recommendations.
  `.trim();
  const editedDraft = await editor.execute(editorInput);
  const finalDraft = editedDraft.length > draftResult.length * 0.5 ? editedDraft : draftResult;

  const seoOptimizer = createSEOOptimizer();
  const seoInput = `
Perform an SEO optimization analysis on this article and provide the optimized version:

PRIMARY KEYWORD: ${primaryKeyword}
TOP KEYWORDS: ${topKws.join(", ")}

ARTICLE:
${finalDraft}

Provide: SEO score, critical fixes, and the optimized article text with all fixes applied.
  `.trim();
  const seoAnalysis = await seoOptimizer.execute(seoInput);

  const metaCreator = createMetaCreator();
  const metaInput = `
Create meta title and meta description for this article:

Topic: ${topic}
Primary Keyword: ${primaryKeyword}
Keywords: ${topKws.join(", ")}

Article Summary:
${finalDraft.slice(0, 500)}...

SEO Context:
${seoAnalysis.slice(0, 300)}

Generate 5 meta title options and 5 meta description options. Mark your RECOMMENDED pick for each.
  `.trim();
  const metaOutput = await metaCreator.execute(metaInput);
  const title = parseTitle(metaOutput) || `${topic}: Complete Guide`;
  const metaDescription =
    parseMetaDescription(metaOutput) ||
    `Learn everything about ${topic}. Comprehensive guide with actionable tips, expert insights, and proven strategies. Start optimizing today.`;

  const internalLinker = createInternalLinker();
  const linkerInput = `
Suggest internal linking opportunities for this article:

Title: ${title}
Primary Keyword: ${primaryKeyword}
Topic: ${topic}

Article:
${finalDraft.slice(0, 1500)}...

Provide 3-5 specific internal link recommendations with anchor text and placement.
  `.trim();
  await internalLinker.execute(linkerInput);

  const headlineGenerator = createHeadlineGenerator();
  const headlineInput = `
Generate 10+ headline variants for this article:

Topic: ${topic}
Primary Keyword: ${primaryKeyword}
Current Title: ${title}

Conversion Goal: organic traffic + engagement
Page Type: SEO blog post
Target Audience: content marketers and business owners

Apply all headline formulas and score each for clarity, specificity, emotional appeal, and SEO value.
  `.trim();
  const headlineOutput = await headlineGenerator.execute(headlineInput);
  const headlineVariants = parseHeadlines(headlineOutput);

  return {
    title,
    metaDescription,
    content: finalDraft,
    keywords,
    headlineVariants,
  };
}