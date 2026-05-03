// packages/onyx-intel/src/pipeline/synthesize.ts
// Calls Claude API to synthesize sources into a grounded intelligence brief.
// Prompt: "Synthesize these sources into a grounded intelligence brief.
//          Cite every claim with [Source N]. Be concise. Max 200 words."

import type { Source } from "../types.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 800;

function buildSourceBlock(sources: Source[]): string {
  return sources
    .slice(0, 12) // cap at 12 sources for context window efficiency
    .map(
      (s, i) =>
        `[Source ${i + 1}] ${s.platform.toUpperCase()} | ${s.title}\n${s.snippet}\nURL: ${s.url}`
    )
    .join("\n\n");
}

/**
 * Synthesize sources into a grounded intelligence brief via Claude.
 * Cites every claim with [Source N]. Max 200 words.
 * Requires ANTHROPIC_API_KEY environment variable.
 */
export async function synthesize(sources: Source[], topic: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  if (sources.length === 0) {
    return `No sources were found for topic: "${topic}". Unable to synthesize a brief.`;
  }

  const sourceBlock = buildSourceBlock(sources);

  const userPrompt = `Topic: "${topic}"

Sources:
${sourceBlock}

Synthesize these sources into a grounded intelligence brief. Cite every claim with [Source N]. Be concise. Max 200 words.`;

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    throw new Error(`Claude API request failed: ${(err as Error).message}`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "(no body)");
    throw new Error(`Claude API HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("Claude API returned no text block");
  }

  return textBlock.text.trim();
}
