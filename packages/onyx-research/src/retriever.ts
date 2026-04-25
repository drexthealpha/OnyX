// ─── Retriever node — parallel fetch from web + @onyx/intel + @onyx/semantic ─
// Deduplicates by URL hash and content similarity (Jaccard on word sets).

import { createHash } from "crypto";
import type { ResearchState, RetrievedItem } from "./types.js";

async function intelSearch(query: string): Promise<RetrievedItem[]> {
  try {
    const mod = await import("@onyx/intel" as any);
    const results = await (mod.search ?? mod.default?.search)?.(query) ?? [];
    return results.map((r: any) => normaliseItem(r, "intel"));
  } catch {
    return [];
  }
}

async function semanticSearch(query: string): Promise<RetrievedItem[]> {
  try {
    const mod = await import("@onyx/semantic" as any);
    const fn = mod.search ?? mod.semanticSearch ?? mod.default?.search;
    if (!fn) return [];
    const results = await fn({ collection: "research", query, limit: 5 }) ?? [];
    return results.map((r: any) => normaliseItem(r, "semantic"));
  } catch {
    return [];
  }
}

async function webSearch(query: string): Promise<RetrievedItem[]> {
  const key = process.env["TAVILY_API_KEY"] ?? process.env["SERPER_API_KEY"];
  if (!key) return [];

  if (process.env["TAVILY_API_KEY"]) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: process.env["TAVILY_API_KEY"], query, max_results: 5 }),
      });
      const data = (await res.json()) as any;
      const items: RetrievedItem[] = (data.results ?? []).map((r: any) => ({
        url: r.url ?? "",
        title: r.title ?? query,
        content: r.content ?? r.snippet ?? "",
        source: "web" as const,
        retrievedAt: new Date().toISOString(),
        urlHash: hashUrl(r.url ?? ""),
      }));
      return items;
    } catch {
      return [];
    }
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env["SERPER_API_KEY"]!,
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });
    const data = (await res.json()) as any;
    return (data.organic ?? []).map((r: any) => ({
      url: r.link ?? "",
      title: r.title ?? query,
      content: r.snippet ?? "",
      source: "web" as const,
      retrievedAt: new Date().toISOString(),
      urlHash: hashUrl(r.link ?? ""),
    }));
  } catch {
    return [];
  }
}

export async function retrieve(state: ResearchState): Promise<ResearchState> {
  const { subQuestions } = state;
  if (subQuestions.length === 0) return state;

  const allItems: RetrievedItem[] = [];

  await Promise.all(
    subQuestions.map(async (question) => {
      const [web, intel, semantic] = await Promise.all([
        webSearch(question),
        intelSearch(question),
        semanticSearch(question),
      ]);
      allItems.push(...web, ...intel, ...semantic);
    }),
  );

  const deduped = deduplicateItems(allItems);

  return { ...state, retrievedContent: deduped };
}

function deduplicateItems(items: RetrievedItem[]): RetrievedItem[] {
  const seenUrls = new Set<string>();
  const unique: RetrievedItem[] = [];

  for (const item of items) {
    if (!item.url || seenUrls.has(item.urlHash)) continue;
    const isDuplicate = unique.some((u) => jaccardSimilarity(u.content, item.content) > 0.85);
    if (isDuplicate) continue;

    seenUrls.add(item.urlHash);
    unique.push(item);
  }

  return unique;
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = new Set([...setA].filter((w) => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function normaliseItem(raw: any, source: RetrievedItem["source"]): RetrievedItem {
  const url = raw.url ?? raw.link ?? raw.id ?? "";
  return {
    url,
    title: raw.title ?? raw.name ?? url,
    content: raw.content ?? raw.text ?? raw.snippet ?? raw.body ?? "",
    source,
    retrievedAt: new Date().toISOString(),
    urlHash: hashUrl(url),
  };
}