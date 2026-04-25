// ─── Memory writer — upserts synthesis to @onyx/semantic ─────────────────────
// Posts completed research to the semantic memory layer so future research
// sessions can retrieve past findings via semantic search.

import type { ResearchState } from "./types.js";

const SEMANTIC_URL = process.env["SEMANTIC_URL"] ?? "http://localhost:4300";

export interface WriteResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function writeToSemantic(result: ResearchState): Promise<WriteResult> {
  const payload = {
    collection: "research",
    id: slugify(result.topic),
    content: result.synthesis,
    metadata: {
      topic: result.topic,
      citationCount: result.citations.length,
      qualityScore: result.qualityScore ?? 0,
      subQuestions: result.subQuestions,
      reportLength: result.report.length,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    const mod = await import("@onyx/semantic" as any);
    const fn = mod.upsert ?? mod.upsertDocument ?? mod.default?.upsert;
    if (fn) {
      const res = await fn(payload);
      return { success: true, id: res?.id ?? payload.id };
    }
  } catch {
    // fall through to HTTP
  }

  try {
    const res = await fetch(`${SEMANTIC_URL}/collections/research/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${body}` };
    }

    const data = (await res.json()) as any;
    return { success: true, id: data?.id ?? payload.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}