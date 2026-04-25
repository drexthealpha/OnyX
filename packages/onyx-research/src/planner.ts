// ─── Planner node — generates 3–5 sub-questions via Claude API ───────────────
// Zero operator cost: uses ANTHROPIC_API_KEY from env (user-provided).
// DeerFlow insight: the planner decomposes the topic into an explicit question set
// before any retrieval begins, keeping downstream nodes focused.

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchState } from "./types.js";

const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

const SYSTEM_PROMPT = `You are a research planning specialist.
Given a research topic, generate between 3 and 5 focused sub-questions
that together provide comprehensive coverage of the topic.
Sub-questions should be specific, answerable, and non-overlapping.
Return ONLY a JSON array of strings. No preamble. No markdown fences.
Example output: ["What is X?","How does Y affect Z?","What are the key metrics for W?"]`;

export async function plan(state: ResearchState): Promise<ResearchState> {
  const userMsg = `Research topic: ${state.topic}\n\nGenerate 3–5 focused sub-questions.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  const raw = extractText(response.content);
  const subQuestions = parseSubQuestions(raw, state.topic);

  return { ...state, subQuestions };
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text.trim())
    .join("");
}

function parseSubQuestions(raw: string, topic: string): string[] {
  const cleaned = raw.replace(/```[a-z]*\n?/gi, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      const questions = parsed
        .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
        .slice(0, 5);

      if (questions.length >= 3) return questions;
    }
  } catch {
    // fall through to extraction
  }

  const lines = cleaned
    .split(/\n|","|",\s*"/)
    .map((l) => l.replace(/^["'\d.\-\s*]+/, "").replace(/["']+$/, "").trim())
    .filter((l) => l.length > 8);

  if (lines.length >= 3) return lines.slice(0, 5);

  return [
    `What is ${topic} and why does it matter?`,
    `What are the key components or mechanisms of ${topic}?`,
    `What are the latest developments in ${topic}?`,
    `What are the main challenges or controversies around ${topic}?`,
  ];
}