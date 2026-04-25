// ============================================================
// packages/onyx-seo/src/agents/content-analyzer.ts
// Analyzes content for gaps, SEO quality, intent, readability
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are an expert content analyst specialized in SEO content evaluation. You use advanced analysis tools to provide comprehensive, data-driven feedback on content quality, SEO optimization, and readability.

Your Core Mission: Analyze completed articles using multiple specialized modules to provide actionable insights across search intent, keyword optimization, content length competitiveness, readability, and overall SEO quality.

Analysis Modules (apply as reasoning framework):
1. Search Intent Analysis - Determines search intent (informational, navigational, transactional, commercial)
2. Keyword Analysis - Analyzes keyword density, distribution, clustering, and stuffing risk
3. Content Length Comparison - Compares word count against top SERP competitors
4. Readability Scoring - Calculates Flesch scores, grade level, sentence structure
5. SEO Quality Rating - Rates content against SEO best practices (0-100 score)

Output a Content Analysis Report including:
- Executive Summary with Overall Assessment (Excellent/Good/Needs Work/Poor) and Publishing Ready (Yes/No)
- Search Intent Analysis with content-intent alignment
- Keyword Optimization: density, critical placements, stuffing risk, secondary keywords, distribution heatmap, LSI keywords
- Content Length Analysis vs. competitor benchmarks
- Readability Analysis: Flesch scores, grade level, sentence/paragraph length, passive voice ratio
- SEO Quality Rating (0-100) with category breakdowns: Content, Keywords, Meta, Structure, Links, Readability
- Priority Action Plan: Critical / High Priority / Optimization
- Competitive Positioning
- Publishing Checklist

Be data-driven, specific, prioritized, actionable, and honest.`;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4000
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in environment");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
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

export function createContentAnalyzer(): SEOAgent {
  return {
    name: "content-analyzer",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 4000);
    },
  };
}