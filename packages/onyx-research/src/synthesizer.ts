// ─── Synthesizer node — full synthesis with inline citations via Claude ───────
// DeerFlow pattern: synthesizer receives all retrieved content, calls a large
// context model, tracks citations, returns markdown with [1]-style markers.

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchState, Citation } from "./types.js";

const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

const SYSTEM = `You are an expert research synthesizer.
Given a research topic, sub-questions, and retrieved sources (with index numbers),
write a comprehensive synthesis in markdown.

Rules:
1. Cover all sub-questions in depth.
2. Every factual claim MUST be followed by a citation marker: [1], [2], etc.
3. Use ONLY the provided sources. Do not invent facts.
4. Structure: ## Overview, ## Key Findings (one subsection per sub-question), ## Analysis, ## Conclusion
5. Minimum 600 words. Maximum 2000 words.
6. At the end, emit a CITATIONS section listing each source used:
   CITATIONS:
   [1] Title | URL | "exact excerpt ≤280 chars"
   [2] ...`;

export async function synthesize(state: ResearchState): Promise<ResearchState> {
  const { topic, subQuestions, retrievedContent } = state;

  if (retrievedContent.length === 0) {
    return {
      ...state,
      synthesis: `# ${topic}\n\n*No sources retrieved. Synthesis unavailable.*`,
      citations: [],
    };
  }

  const sourceList = retrievedContent
    .slice(0, 30)
    .map((item, i) => {
      const content = item.content.slice(0, 1500);
      return `[${i + 1}] Title: ${item.title}\nURL: ${item.url}\nContent: ${content}`;
    })
    .join("\n\n---\n\n");

  const userMsg = [
    `Research topic: ${topic}`,
    `Sub-questions:\n${subQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
    `Sources:\n${sourceList}`,
    `Write the synthesis now.`,
  ].join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  });

  const fullText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const citations = parseCitations(fullText, retrievedContent);

  const synthesis = fullText.replace(/\nCITATIONS:\n[\s\S]*$/, "").trim();

  return { ...state, synthesis, citations };
}

function parseCitations(text: string, sources: ResearchState["retrievedContent"]): Citation[] {
  const citationsSection = text.match(/CITATIONS:\n([\s\S]+)$/);
  if (!citationsSection?.[1]) {
    return buildFallbackCitations(text, sources);
  }

  const lines = citationsSection[1].trim().split("\n");
  const citations: Citation[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s+(.+?)\s+\|\s+(\S+)\s+\|\s+"?(.{0,280})"?/);
    if (!match) continue;
    const [, id, title, url, excerpt] = match;
    if (!id || !title || !url) continue;
    citations.push({ id: `[${id}]`, url: url.trim(), title: title.trim(), excerpt: (excerpt ?? "").trim() });
  }

  if (citations.length > 0) return citations;
  return buildFallbackCitations(text, sources);
}

function buildFallbackCitations(
  text: string,
  sources: ResearchState["retrievedContent"],
): Citation[] {
  const usedIndices = new Set<number>();
  const markerRe = /\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(text)) !== null) {
    const n = parseInt(m[1]!, 10);
    if (n >= 1 && n <= sources.length) usedIndices.add(n);
  }

  return [...usedIndices].sort((a, b) => a - b).map((n) => {
    const src = sources[n - 1]!;
    return {
      id: `[${n}]`,
      url: src.url,
      title: src.title,
      excerpt: src.content.slice(0, 280),
    };
  });
}