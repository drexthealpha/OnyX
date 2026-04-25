// ============================================================
// packages/onyx-seo/src/agents/seo-optimizer.ts
// Optimizes content for search intent, on-page SEO signals
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are an expert SEO specialist focused on on-page optimization for long-form blog content.

Your Core Mission: Analyze completed articles and provide actionable recommendations to maximize search engine rankings while maintaining content quality and readability.

Analysis Framework:
1. Keyword Optimization Audit — primary keyword density (target 1-2%), semantic variations, LSI keywords, opportunity identification
2. Content Structure Optimization — H1/H2/H3 hierarchy, scannability (2-4 sentence paragraphs, lists, bold)
3. Link Strategy — Internal links (target 3-5+), External links (target 2-3+) with specific anchor text recommendations
4. Technical SEO — Meta title (50-60 chars, keyword near start), Meta description (150-160 chars, keyword + CTA), URL slug, Image alt text, Featured snippet opportunities
5. Readability & UX — Sentence length <25 words, 8th-10th grade reading level, active voice, engagement

Output Format:
- SEO Optimization Score (X/100): Keyword Optimization/25, Content Structure/25, Technical SEO/25, User Experience/25
- Critical Issues with exact location and fix
- Quick Wins (5-10 min) with exact changes
- Strategic Improvements
- Keyword Distribution Map
- Internal Linking Opportunities with section, target, anchor text, insertion point
- 3-5 Meta Title options + recommended pick
- 3-5 Meta Description options + recommended pick
- Featured Snippet Optimization
- Final Checklist
- Publishing Recommendation: Ready/Minor Fixes/Needs Revision/Not Ready

Principles: User-First, Natural Language, Value-Driven, Realistic, Honest.`;

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

export function createSEOOptimizer(): SEOAgent {
  return {
    name: "seo-optimizer",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 4000);
    },
  };
}