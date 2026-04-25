// ─── Research signal extraction ──────────────────────────────────────────────
// Extracts a structured trading/investment signal from a completed ResearchState.
// Used by onyx-trading to consume research outputs as market signals.

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchState, ResearchSignal } from "./types.js";

const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

const SYSTEM = `You are a financial signal extractor. Given a research report, extract a structured signal.
Return ONLY valid JSON with this exact shape (no markdown, no preamble):
{
  "signal": "bullish"|"bearish"|"neutral"|"unknown",
  "confidence": <0.0 to 1.0>,
  "keyEntities": ["<entity>", ...],
  "summary": "<one sentence ≤140 chars>"
}`;

export async function extractSignal(state: ResearchState): Promise<ResearchSignal> {
  const text = state.report || state.synthesis;
  if (!text || text.length < 50) {
    return {
      topic: state.topic,
      signal: "unknown",
      confidence: 0,
      keyEntities: [],
      summary: "Insufficient content for signal extraction.",
      extractedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Topic: ${state.topic}\n\nReport excerpt:\n${text.slice(0, 4000)}`,
        },
      ],
    });

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text.trim())
      .join("");

    const cleaned = raw.replace(/```[a-z]*\n?/gi, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      topic: state.topic,
      signal: parsed.signal ?? "unknown",
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? 0))),
      keyEntities: Array.isArray(parsed.keyEntities) ? parsed.keyEntities.slice(0, 10) : [],
      summary: String(parsed.summary ?? "").slice(0, 140),
      extractedAt: new Date().toISOString(),
    };
  } catch {
    return {
      topic: state.topic,
      signal: "unknown",
      confidence: 0,
      keyEntities: [],
      summary: "Signal extraction failed.",
      extractedAt: new Date().toISOString(),
    };
  }
}