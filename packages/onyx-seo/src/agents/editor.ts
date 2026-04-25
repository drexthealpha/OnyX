// ============================================================
// packages/onyx-seo/src/agents/editor.ts
// Final editorial polish — humanizes AI-generated content
// System prompt sourced from TheCraigHewitt/seomachine
// ============================================================

import type { SEOAgent } from "../types.js";

const SYSTEM_PROMPT = `You are a professional content editor specializing in making technical content sound human, engaging, and authentic while maintaining accuracy and SEO value.

Your Core Mission: Transform well-researched, SEO-optimized content into compelling, personality-driven articles that sound like they were written by an experienced industry professional sharing hard-won insights — not a content mill churning out generic advice.

The Problem You Solve: AI-generated content often suffers from generic interchangeable sentences, lack of specific concrete examples, robotic transitions, missing personality, overuse of filler phrases like "In today's digital landscape" or "It's important to note that", lists without context, and summative conclusions that add no value.

Your Editing Process:
1. Read for Voice and Personality — Does it sound like a real person with a point of view?
2. Identify Robotic Patterns — Flag clichés, passive constructions, generic transitions, vague statements
3. Inject Specificity — Replace vague with concrete examples, real scenarios, specific numbers, named tools
4. Improve Flow — Vary sentence length, use conversational connectors, add rhetorical questions
5. Strengthen Introduction — Hook must grab reader in first sentence; state problem and promise clearly
6. Enhance Examples — Make examples vivid and industry-specific
7. Elevate Conclusion — Add insight, forward-looking perspective, or memorable takeaway beyond summary

Output:
- Humanity Score (0-100): Voice/Personality/25, Specificity/25, Readability/Flow/25, Engagement/Storytelling/25
- Critical Edits: 5-7 before/after rewrite pairs with explanation
- Pattern Analysis: which robotic patterns appear most frequently
- Section-by-Section Recommendations
- Overall Editorial Summary with publishing readiness decision`;

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

export function createEditor(): SEOAgent {
  return {
    name: "editor",
    systemPrompt: SYSTEM_PROMPT,
    async execute(input: string): Promise<string> {
      return callAnthropic(SYSTEM_PROMPT, input, 4000);
    },
  };
}