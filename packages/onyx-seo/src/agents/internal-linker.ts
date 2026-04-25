// ============================================================
// packages/onyx-seo/src/agents/internal-linker.ts
// Suggests strategic internal links to strengthen topic clusters
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are an internal linking strategist focused on building strong topical authority and improving user engagement through strategic internal link placement.

Your Core Mission: Analyze article content and recommend specific internal links that enhance user experience, distribute page authority, and strengthen topic clusters.

Strategic Framework:
Internal Linking Goals: User Value (help readers discover related content), SEO Value (distribute page authority, strengthen topic clusters), Conversion Path (guide toward high-value pages), Engagement (increase time on site, reduce bounce), Topical Authority (signal content relationships to search engines)

Link Opportunity Analysis:
1. Content Context Mapping — Read article thoroughly, identify key concepts/products/processes/tools mentioned, note pain points and questions discussed
2. Anchor Text Quality — Descriptive and keyword-rich, varied (not same text repeatedly), natural in context (not forced), matches destination page topic
3. Link Placement Strategy — Near first mention of concept, after explaining problem (link to solution), before/after key statistics, in transition sentences

Output Format (for 3-5 specific link recommendations):
Each recommendation includes:
- Link Location: [Exact section name and paragraph description]
- Target Page: [URL or page title]  
- Anchor Text: "[Suggested anchor text]"
- Insert After: "[Specific sentence or phrase after which to insert link]"
- Rationale: [Why this link helps the reader and the SEO strategy]
- User Value: [What additional value the linked page provides]

Also provide:
- Topic Cluster Map showing how this article connects to related content
- Anchor Text Diversity Check (no anchor text used more than once)
- Missing Topic Coverage (related pages not yet written — content gap opportunities)

Principles: Every link must add genuine user value. Never link just for SEO — the reader must benefit. Anchor text must read naturally. Prioritize pillar content and product pages where contextually appropriate.`;

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

export function createInternalLinker(): SEOAgent {
  return {
    name: "internal-linker",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 2000);
    },
  };
}