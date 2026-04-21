// ─────────────────────────────────────────────
// onyx-mem · inject.ts
// Retrieves relevant past memories for context injection.
// Calls @onyx/semantic (stub until S09 is live) or falls back
// to SQLite keyword scan.
// ─────────────────────────────────────────────

import type { MemoryCrystal } from './types.js';
import { listCrystals } from './store.js';

const MAX_INJECT_RESULTS = 3;
const INJECT_PREFIX = 'From previous sessions:';

// ── Semantic search (stub) ───────────────────────────────────────────────────

/**
 * Attempt to call @onyx/semantic for vector search.
 * Returns null if the package is not available (graceful degradation).
 */
async function semanticSearch(
  topic: string,
  collection: string,
  limit: number,
): Promise<MemoryCrystal[] | null> {
  try {
    // Dynamic import — @onyx/semantic is S09 and may not be built yet.
    const semantic = await import('@onyx/semantic' as string);
    const results = await semantic.search(collection, topic, limit);

    if (!Array.isArray(results) || results.length === 0) return null;

    // Reconstruct lightweight MemoryCrystal from payload fields.
    return results.map((r) => {
      const p = r.payload as Partial<MemoryCrystal>;
      return {
        id: r.id,
        sessionId: p.sessionId ?? '',
        timestamp: p.timestamp ?? 0,
        mode: p.mode ?? 'code--ts',
        decisions: p.decisions ?? [],
        facts: p.facts ?? [],
        preferences: p.preferences ?? [],
        errors: p.errors ?? [],
        rawTokenCount: p.rawTokenCount ?? 0,
        compressedTokenCount: p.compressedTokenCount ?? 0,
      } satisfies MemoryCrystal;
    });
  } catch {
    // @onyx/semantic not yet available.
    return null;
  }
}

// ── SQLite keyword fallback ──────────────────────────────────────────────────

/**
 * Naive keyword relevance: score a crystal by how many of its text fields
 * contain at least one word from the topic query.
 */
function scoreRelevance(crystal: MemoryCrystal, topic: string): number {
  const words = topic.toLowerCase().split(/\s+/);
  const allText = [
    ...crystal.decisions,
    ...crystal.facts,
    ...crystal.preferences,
    ...crystal.errors,
  ]
    .join(' ')
    .toLowerCase();

  return words.filter((w) => w.length > 2 && allText.includes(w)).length;
}

function sqliteFallback(topic: string, limit: number): MemoryCrystal[] {
  const all = listCrystals(200);
  return all
    .map((c) => ({ crystal: c, score: scoreRelevance(c, topic) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ crystal }) => crystal);
}

// ── Formatter ───────────────────────────────────────────────────────────────

function formatCrystals(crystals: MemoryCrystal[]): string {
  if (crystals.length === 0) {
    return `${INJECT_PREFIX}\n(no relevant memories found)`;
  }

  const lines: string[] = [`${INJECT_PREFIX}`];

  for (const c of crystals) {
    const date = new Date(c.timestamp).toISOString().split('T')[0];
    lines.push(`\n[Session ${c.sessionId.slice(0, 8)} · ${date} · ${c.mode}]`);

    for (const d of c.decisions) lines.push(`  • Decision: ${d}`);
    for (const f of c.facts) lines.push(`  • Fact: ${f}`);
    for (const p of c.preferences) lines.push(`  • Preference: ${p}`);
    for (const e of c.errors) lines.push(`  • Error: ${e}`);
  }

  return lines.join('\n');
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve top-3 relevant memories for a topic and format them as a
 * system context string ready for injection into a new session prompt.
 *
 * @param topic - The user's current prompt / topic of interest
 * @param collection - Qdrant collection name (default: 'memories')
 * @returns Formatted "From previous sessions:\n..." string for injection
 */
export async function inject(
  topic: string,
  collection = 'memories',
): Promise<string> {
  // Try semantic search first (S09 when available).
  const semanticResults = await semanticSearch(topic, collection, MAX_INJECT_RESULTS);

  if (semanticResults !== null) {
    return formatCrystals(semanticResults);
  }

  // Fallback: keyword scoring over SQLite.
  const fallbackResults = sqliteFallback(topic, MAX_INJECT_RESULTS);
  return formatCrystals(fallbackResults);
}