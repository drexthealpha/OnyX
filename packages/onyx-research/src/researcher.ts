// ─── Researcher node — deep per-source analysis via Claude ───────────────────
// Inspired by DeerFlow's sub-agent per-source deep dive.
// Each retrieved item is analysed in context of the research topic,
// extracting key claims, evidence quality, and relevance score.

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchState, RetrievedItem } from "./types.js";

const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

const SYSTEM = `You are a meticulous research analyst. Given a source excerpt and a research topic, extract:
1. KEY_CLAIMS: 2–5 bullet claims supported by this source
2. EVIDENCE_QUALITY: one of [high|medium|low] with one-line rationale
3. RELEVANCE: score 0–10 of how relevant this source is to the topic
Return structured text in exactly this format:
KEY_CLAIMS:
- <claim>
EVIDENCE_QUALITY: <level> — <rationale>
RELEVANCE: <score>`;

export async function analyzeSource(
  state: ResearchState,
  item: RetrievedItem,
): Promise<ResearchState> {
  if (item.content.trim().length < 80) return state;

  const excerpt = item.content.slice(0, 8000);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Topic: ${state.topic}\n\nSource title: ${item.title}\nSource URL: ${item.url}\n\nContent:\n${excerpt}`,
        },
      ],
    });

    const analysis = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const enriched: RetrievedItem = {
      ...item,
      content: `[ANALYSIS]\n${analysis}\n\n[ORIGINAL]\n${item.content}`,
    };

    const retrievedContent = state.retrievedContent.map((r) =>
      r.urlHash === item.urlHash ? enriched : r,
    );

    return { ...state, retrievedContent };
  } catch {
    return state;
  }
}