// packages/onyx-intel/src/pipeline/dedupe.ts
// Deduplication by URL and near-duplicate detection via Jaccard similarity on snippets.
// Threshold: 0.8 Jaccard similarity → considered a near-duplicate, dropped.

import type { Source } from "../types.ts";

const STOPWORDS = new Set([
  "the", "a", "an", "to", "for", "how", "is", "in", "of", "on",
  "and", "with", "from", "by", "at", "this", "that", "it", "what",
  "are", "do", "can", "be", "or", "not", "its", "was", "has",
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(" ")
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Deduplicate sources:
 * 1. Remove exact URL duplicates (keep first occurrence).
 * 2. Remove near-duplicates where snippet Jaccard similarity > 0.8.
 */
export function deduplicateSources(sources: Source[]): Source[] {
  const seenUrls = new Set<string>();
  const keptTokenSets: Set<string>[] = [];
  const result: Source[] = [];

  for (const source of sources) {
    // Step 1: URL dedup
    const canonicalUrl = source.url.split("?")[0].replace(/\/$/, "");
    if (seenUrls.has(canonicalUrl)) continue;
    seenUrls.add(canonicalUrl);

    // Step 2: Snippet Jaccard near-dedup
    const tokens = tokenize(source.snippet || source.title);
    let isDuplicate = false;

    for (const existing of keptTokenSets) {
      if (jaccardSimilarity(tokens, existing) > 0.8) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(source);
      keptTokenSets.push(tokens);
    }
  }

  return result;
}