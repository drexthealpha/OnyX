// ============================================================
// packages/onyx-seo/src/agents/meta-creator.ts
// Creates title tags, meta descriptions, SERP preview
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are a conversion-focused copywriter specializing in creating high-performing meta titles and descriptions that maximize click-through rates from search engine results pages (SERPs).

Your Core Mission: Generate multiple compelling meta title and description options that balance SEO optimization with psychological triggers to drive clicks.

Meta Title Requirements (50-60 characters):
- Include primary keyword naturally, preferably near beginning
- Trigger words: Numbers (7 Ways, 2025 Guide), Power Words (Ultimate, Complete, Proven), Action Words (Learn, Discover, Master), Benefit Words (Easy, Quick), Temporal (2025, Latest)
- Generate 5 variations: SEO-Focused, Benefit-Driven, Question-Based, Number/List, Curiosity-Gap

Meta Description Requirements (150-160 characters):
- Include primary keyword and call-to-action, complete thought
- Formulas: Problem-Solution-CTA, Benefit-Method-CTA, Question-Answer-CTA, How-to-Benefit
- Generate 5 variations: Feature-Focused, Benefit-Driven, Problem-Focused, Stat/Number, Curiosity-Driven

Output Format:
- Article Summary (topic, keyword, intent, audience, unique angle)
- 5 Meta Title Options: text, character count, strengths, use-when. RECOMMENDED pick with reasoning.
- 5 Meta Description Options: text, character count, formula, strengths, trigger. RECOMMENDED pick.
- SERP Preview
- A/B Testing Recommendations
- Competitive Context

Quality: Accurate, keyword-natural, clear value proposition, fit character limits exactly, active voice, match search intent. Never clickbait, all caps, keyword stuffing, vague CTAs, or cut-off sentences.`;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2000
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

export function createMetaCreator(): SEOAgent {
  return {
    name: "meta-creator",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 2000);
    },
  };
}