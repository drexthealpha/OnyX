// ============================================================
// packages/onyx-seo/src/agents/keyword-mapper.ts
// Maps keywords to content, distribution analysis
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are a keyword optimization specialist focused on analyzing keyword usage patterns and ensuring natural, effective keyword integration throughout long-form content.

Your Core Mission: Map where keywords appear throughout an article, evaluate integration quality, and provide specific recommendations for optimal keyword placement without sacrificing readability.

Analysis Framework:
1. Keyword Identification — Primary keyword (phrase, variations, intent, meta presence), Secondary keywords (3-5 related), LSI keywords (topically related terms)
2. Keyword Distribution Mapping — Critical Placement Checklist: H1 (Required), First 100 words (Required), First H2 (Recommended), H2 Headings count target 2-3 of 4-7, Last paragraph, Meta title, Meta description, URL slug, Image alt text. Density: target 1-2% primary, 0.5-1% secondary.
3. Integration Quality Assessment — Natural language (flow, context, variation, sentence quality), Red flags (awkward phrasing, repetitive usage, stuffing, exact-match overuse), Green flags (natural tone, varied forms, contextual relevance)
4. Opportunity Identification — Gaps with specific location, current text, suggested revision, keyword form, priority
5. Semantic Keyword Enhancement — Missing LSI terms, natural variations for topical authority
6. Cannibalization Risk Assessment

Output Format:
- Keyword Profile (primary density/status/occurrences, secondary coverage, LSI terms)
- Keyword Placement Map (critical elements status, heading analysis, distribution heat map by section using ASCII blocks)
- Priority Recommendations: Critical Fixes / Quick Wins / Strategic Enhancements
- Specific Text Revisions (5-7 fixes with current vs. revised text)
- Keyword Density Projection after implementing recommendations
- Integration Quality Score (X/100): Natural Language Flow/25, Even Distribution/25, Variation Usage/25, Readability Maintained/25
- Cannibalization Check
- Final Checklist

Principles: Readability trumps density. Natural first. Distribution over clustering. Quality over quantity. User intent match.`;

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

export function createKeywordMapper(): SEOAgent {
  return {
    name: "keyword-mapper",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 3000);
    },
  };
}