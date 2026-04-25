// ─── Podcast script generator + audio dispatch ────────────────────────────────
// DeerFlow has a built-in podcast-generation skill (skills/public/podcast-generation).
// We implement the same pattern:
//   1. Convert report to a two-host dialogue via Claude API
//   2. Dispatch the script to @onyx/studio for audio synthesis
//
// Host A: The Skeptic — challenges assumptions, asks hard questions
// Host B: The Explainer — synthesises findings, provides context

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchState } from "../types.js";

const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

const SYSTEM = `You are a podcast script writer specialising in research conversations.
Write a compelling two-host podcast dialogue about the given research report.

Format rules:
- Host A (The Skeptic): challenges assumptions, asks probing questions, represents the devil's advocate
- Host B (The Explainer): synthesises findings, provides context, cites sources
- Aim for 1200–1800 words (approx 8–12 minutes of audio)
- Start with a brief intro hook (2–3 lines each)
- End with 3 key takeaways stated by both hosts together
- Format each line as: [HOST_A]: <dialogue> or [HOST_B]: <dialogue>
- Reference specific citations by number when relevant: "as source [2] shows..."
- Natural, conversational tone — not academic

Return ONLY the dialogue, no other text.`;

export async function toPodcastScript(report: string, state?: ResearchState): Promise<string> {
  const topic = state?.topic ?? "Research Findings";
  const citationSummary = state?.citations
    ? state.citations.slice(0, 8).map((c) => `${c.id} — ${c.title}`).join("\n")
    : "";

  const userMsg = [
    `Research topic: ${topic}`,
    citationSummary ? `Key citations:\n${citationSummary}` : "",
    `Report:\n${report.slice(0, 6000)}`,
    `Write the podcast script now.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  });

  const script = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  dispatchToStudio(script, topic).catch((err) =>
    console.error("[podcast] studio dispatch failed:", err),
  );

  return script;
}

interface StudioJob {
  jobId: string;
  status: string;
}

async function dispatchToStudio(script: string, topic: string): Promise<StudioJob | null> {
  try {
    const mod = await import("@onyx/studio" as any);
    const fn = mod.generateAudio ?? mod.synthesize ?? mod.default?.generateAudio;
    if (fn) {
      return await fn({ script, topic, format: "mp3", voices: { HOST_A: "alloy", HOST_B: "nova" } });
    }
  } catch {
    // fall through to HTTP
  }

  const studioUrl = process.env["STUDIO_URL"] ?? "http://localhost:4400";
  try {
    const res = await fetch(`${studioUrl}/jobs/podcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script,
        topic,
        format: "mp3",
        voices: { HOST_A: "alloy", HOST_B: "nova" },
      }),
    });

    if (!res.ok) return null;
    return (await res.json()) as StudioJob;
  } catch {
    return null;
  }
}