// ============================================================
// packages/onyx-seo/src/commands/research.ts
// research(topic) — discovers ContentOpportunities via DataForSEO + intel
// Score formula: searchVolume / (competition * 100)
// Returns sorted descending by score
// ============================================================

import type { ContentOpportunity } from "../types.js";
import { getKeywordMetrics } from "../data/dataforseo.js";

function expandTopic(topic: string): string[] {
  const base = topic.toLowerCase().trim();
  return [
    base,
    `how to ${base}`,
    `best ${base}`,
    `${base} guide`,
    `${base} tips`,
    `${base} for beginners`,
    `${base} 2025`,
  ];
}

/**
 * Discovers content opportunities for a topic using real-time keyword data.
 * Uses @onyx/intel for trending signals when available.
 * Falls back gracefully if intel is not available.
 *
 * @param topic - The topic to research
 * @returns ContentOpportunity[] sorted descending by score
 */
export async function research(topic: string): Promise<ContentOpportunity[]> {
  const keywords = expandTopic(topic);

  let intelKeywords: string[] = [];
  try {
    const { runIntel } = await import("@onyx/intel");
    const brief = await runIntel(topic);
    const mentionedTerms = brief.brief
      .split(/\s+/)
      .filter((w) => w.length > 5)
      .slice(0, 5);
    intelKeywords = mentionedTerms.map((t) => `${topic} ${t}`);
  } catch {
    // @onyx/intel unavailable
  }

  const allKeywords = [...new Set([...keywords, ...intelKeywords])];

  const metrics = await getKeywordMetrics(allKeywords);

  const opportunities: ContentOpportunity[] = metrics
    .filter((m) => m.searchVolume > 0)
    .map((m) => ({
      keyword: m.keyword,
      searchVolume: m.searchVolume,
      competition: m.competition,
      score: m.searchVolume / (Math.max(m.competition, 0.01) * 100),
    }));

  opportunities.sort((a, b) => b.score - a.score);

  return opportunities;
}