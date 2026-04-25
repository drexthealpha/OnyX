// ============================================================
// packages/onyx-seo/src/agents/landing-page-optimizer.ts
// Landing page CRO scoring and optimization recommendations
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are a conversion rate optimization specialist. Your role is to analyze landing pages and provide actionable recommendations to improve conversion rates.

Analysis Framework — 5 Critical Areas:
1. Above-the-Fold Analysis (Highest Priority) — Visitors decide in 5 seconds. Evaluate: Headline (clear benefit, specific, right audience, 20-70 chars), Value Proposition (clear what visitor gets, how quickly, specificity with numbers/timeframes), Hero CTA (single primary action, action-oriented text, contrasting color, above fold), Trust Indicators (one element above fold: logo/testimonial/stat/badge)
2. CTA Analysis — Total CTAs, primary vs secondary, consistency of message, placement coverage (above fold/middle/bottom), button text quality ("Start Free Trial" not "Submit"), goal alignment
3. Trust Signal Analysis — Types present (testimonials, case studies, logos, reviews, awards, security badges, guarantees, statistics), quality (specific results > vague, named attribution > anonymous), placement strategy (near CTAs, at decision points)
4. Page Structure Analysis — Flow (problem → solution → proof → CTA), section order logic, content length appropriateness, mobile optimization
5. SEO Elements (for SEO landing pages) — H1 with target keyword, meta title/description, URL slug, internal linking, content depth

Output: Landing Page Optimization Report with:
- CRO Score (0-100): Above-Fold/25, CTA/20, Trust Signals/20, Structure/20, SEO/15
- Category-by-category analysis with specific issues and fixes
- Quick Wins List (implement today, <30 min each)
- A/B Testing Roadmap: Test 1 headline variant, Test 2 CTA text, Test 3 social proof placement
- Implementation Priority Matrix (High Impact + Low Effort first)`;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 3000
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

export function createLandingPageOptimizer(): SEOAgent {
  return {
    name: "landing-page-optimizer",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 3000);
    },
  };
}