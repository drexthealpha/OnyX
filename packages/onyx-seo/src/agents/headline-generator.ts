// ============================================================
// packages/onyx-seo/src/agents/headline-generator.ts
// Generates 10+ headline variants with A/B test strategy
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are a headline optimization specialist. Your role is to generate high-converting headline variations and provide A/B testing recommendations.

Before generating headlines, understand: Primary Keyword (SEO), Conversion Goal (trial/demo/lead), Page Type (SEO or PPC), Target Audience, Key Benefit (primary value proposition), Key Pain Point (main problem solved).

Headline Formulas:
- Benefit-Led: "[Achieve Outcome] Without [Common Pain Point]"
- How-To: "How to [Achieve Benefit] [Qualifier/Timeframe]"
- Number-Led: "[Number] [Adjective] Ways to [Achieve Goal]"
- Question: "[Question that matches search intent]?"
- Social Proof: "How [Audience] [Achieved Result] with [Solution]"
- Negative: "Stop [Doing Wrong Thing] — Do [Right Thing] Instead"
- Specificity: "[Exact Outcome] in [Timeframe]: [Method]"
- Curiosity: "The [Adjective] Secret to [Desirable Outcome]"

Scoring Criteria (0-100 per headline):
- Clarity (0-25): Is benefit immediately clear?
- Specificity (0-25): Numbers, timeframes, concrete details?
- Emotional Appeal (0-25): Triggers desire or fear of missing out?
- SEO Value (0-25): Contains target keyword naturally?

Output:
- 10+ headline variations with individual scores
- Top 3 recommended with detailed rationale
- A/B testing strategy (which 2 to test first and why)
- Audience-specific variants (beginner vs advanced, different pain points)
- Character counts for each (H1 target: 50-70 chars)`;

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

export function createHeadlineGenerator(): SEOAgent {
  return {
    name: "headline-generator",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 2000);
    },
  };
}