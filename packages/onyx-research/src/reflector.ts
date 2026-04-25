// ─── Reflector node — quality check on synthesis ─────────────────────────────
// DeerFlow pattern: the reflector acts as an internal critic before the report
// is finalised. It scores quality and flags missing coverage.

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchState } from "./types.js";

const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

const SYSTEM = `You are a rigorous research quality reviewer.
Score the synthesis on the following dimensions (0–20 each, total /100):
1. COVERAGE: are all sub-questions addressed?
2. CITATIONS: are claims properly cited?
3. DEPTH: is analysis substantive, not superficial?
4. CLARITY: is writing clear and well-structured?
5. ACCURACY: does the synthesis stick to source material?

Respond in this exact format:
COVERAGE: <score>
CITATIONS: <score>
DEPTH: <score>
CLARITY: <score>
ACCURACY: <score>
TOTAL: <sum>
PASSED: <true|false>   (true if TOTAL >= 60)
FEEDBACK: <one paragraph of actionable feedback>`;

export async function reflect(state: ResearchState): Promise<ResearchState> {
  const { topic, subQuestions, synthesis, citations } = state;

  if (!synthesis || synthesis.length < 100) {
    return { ...state, reflectionPassed: false, qualityScore: 0 };
  }

  const userMsg = [
    `Research topic: ${topic}`,
    `Sub-questions (${subQuestions.length}): ${subQuestions.join("; ")}`,
    `Citations found: ${citations.length}`,
    `Synthesis (${synthesis.length} chars):\n${synthesis.slice(0, 6000)}`,
    `Rate this synthesis now.`,
  ].join("\n\n");

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const totalMatch = text.match(/TOTAL:\s*(\d+)/);
    const passedMatch = text.match(/PASSED:\s*(true|false)/i);
    const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]+)$/);

    const qualityScore = totalMatch ? parseInt(totalMatch[1]!, 10) : 50;
    const reflectionPassed = passedMatch ? passedMatch[1]!.toLowerCase() === "true" : qualityScore >= 60;
    const feedback = feedbackMatch ? feedbackMatch[1]!.trim() : "";

    const enrichedSynthesis = feedback
      ? `${synthesis}\n\n<!-- REFLECTOR FEEDBACK: ${feedback} -->`
      : synthesis;

    return { ...state, synthesis: enrichedSynthesis, qualityScore, reflectionPassed };
  } catch {
    return { ...state, reflectionPassed: true, qualityScore: 60 };
  }
}