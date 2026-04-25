// ─── Slides outline generator ─────────────────────────────────────────────────
// Converts a ResearchState into a structured slide outline (JSON).
// onyx-content will consume this to produce a PPTX via its slide builder.

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchState } from "../types.js";

const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

export interface SlideOutline {
  title: string;
  slides: Slide[];
}

export interface Slide {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes?: string;
}

const SYSTEM = `You are a presentation designer. Given a research report, create a structured slide deck outline.
Return ONLY valid JSON (no markdown fences, no preamble) with this shape:
{
  "title": "<deck title>",
  "slides": [
    {
      "slideNumber": 1,
      "title": "<slide title>",
      "bulletPoints": ["<point>", ...],
      "speakerNotes": "<optional notes>"
    },
    ...
  ]
}
Rules:
- 8–12 slides total
- First slide: Title + author line
- Last slide: Key Takeaways + Q&A
- 3–5 bullet points per slide, each ≤15 words
- Include a citations slide if there are ≥3 citations`;

export async function toSlidesOutline(state: ResearchState): Promise<SlideOutline> {
  const { topic, synthesis, citations, subQuestions } = state;

  const citationList = citations
    .slice(0, 10)
    .map((c) => `${c.id} ${c.title} — ${c.url}`)
    .join("\n");

  const userMsg = [
    `Topic: ${topic}`,
    `Sub-questions: ${subQuestions.join("; ")}`,
    `Citations (${citations.length}):\n${citationList}`,
    `Report excerpt:\n${synthesis.slice(0, 5000)}`,
    `Generate the slide deck outline now.`,
  ].join("\n\n");

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text.trim())
      .join("");

    const cleaned = raw.replace(/```[a-z]*\n?/gi, "").trim();
    return JSON.parse(cleaned) as SlideOutline;
  } catch {
    return {
      title: `Research: ${topic}`,
      slides: [
        {
          slideNumber: 1,
          title: topic,
          bulletPoints: ["Deep research synthesis", `${subQuestions.length} research questions`, `${citations.length} sources cited`],
          speakerNotes: "Opening slide",
        },
        ...subQuestions.map((q, i) => ({
          slideNumber: i + 2,
          title: q,
          bulletPoints: ["Research findings", "Key insights", "Supporting evidence"],
        })),
        {
          slideNumber: subQuestions.length + 2,
          title: "Key Takeaways",
          bulletPoints: ["See full report for complete findings", "Questions welcome"],
        },
      ],
    };
  }
}