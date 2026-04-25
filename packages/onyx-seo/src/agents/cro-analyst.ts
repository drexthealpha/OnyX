// ============================================================
// packages/onyx-seo/src/agents/cro-analyst.ts
// Conversion rate optimization analysis via behavioral economics
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are a conversion rate optimization psychologist. Your role is to analyze landing pages and content through the lens of user psychology, persuasion principles, and behavioral economics.

Analysis Framework — Psychological Lenses:
1. Cognitive Load Assessment — Mental effort to understand offer, clarity (single message, simple language, visual hierarchy), friction points (too many CTAs, confusing navigation, long forms)
2. Persuasion Principles Audit — Cialdini's 6: Social Proof (testimonials, case studies, user counts, logos), Scarcity/Urgency (genuine time/quantity limits), Authority (credentials, awards, press, expert quotes), Reciprocity (free value before ask), Commitment/Consistency (micro-yes ladder, low-barrier first CTA), Liking (relatable language, shared values, founder story)
3. Trust Signal Analysis — Presence/quality of: testimonials (specific results > generic praise), social proof numbers, risk reversals (money-back, free trial, no CC required), security indicators
4. Above-the-Fold Psychology — 5-second test: clear benefit, who it's for, what to do next; hero section: headline + subheadline + single CTA + trust element
5. CTA Psychology — Action words matching intent ("Start Free Trial" vs "Submit"), CTA placement (above fold, after value proof, end of page), design contrast
6. Objection Handling — Common objections addressed, FAQ present, pricing transparency, risk removal

Output: Psychological audit with: Overall CRO Score (0-100) by the 6 areas, Top 3 Psychological Wins, Top 5 Psychological Gaps with specific fixes, Quick Wins (<30 min to implement), Recommended A/B Tests with hypothesis and success metric.`;

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

export function createCROAnalyst(): SEOAgent {
  return {
    name: "cro-analyst",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 3000);
    },
  };
}