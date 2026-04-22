/**
 * bug-patterns.ts — Stores and retrieves bug patterns in @onyx/mem.
 *
 * Implements the Archon continuous improvement pattern: bugs discovered
 * during adversarial testing are stored, then injected into future SWE
 * sessions to avoid repeating the same mistakes.
 *
 * Uses @onyx/mem with mode 'code--ts' for TypeScript-specific patterns.
 */

const MEM_MODE = 'code--ts';

/**
 * Minimal interface for @onyx/mem integration.
 * The actual package is a peer dependency.
 */
interface OnyxMemModule {
  store(key: string, value: string, mode: string): Promise<void>;
  retrieve(prefix: string, mode: string): Promise<Array<{ key: string; value: string }>>;
}

/**
 * Attempt to load @onyx/mem dynamically.
 * Returns null if the package is not available.
 */
async function loadOnyxMem(): Promise<OnyxMemModule | null> {
  try {
    // Dynamic import allows graceful degradation when @onyx/mem is not installed
    const mod = await import('@onyx/mem');
    return mod as unknown as OnyxMemModule;
  } catch {
    return null;
  }
}

/**
 * Create a deterministic key for a bug pattern.
 */
function createPatternKey(pattern: string): string {
  // Use a hash-like slug: take first 40 chars, replace non-alphanumeric with -
  const slug = pattern
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
    .replace(/^-|-$/g, '');
  return `bug-pattern:${slug}:${Date.now()}`;
}

/**
 * Store a bug pattern discovered during adversarial testing.
 *
 * @param pattern - The bug pattern description (e.g. "null dereference in fetchIssue when body is null")
 * @param context - Where this pattern was found (e.g. "github/issues.ts adversarial-loop")
 */
export async function storeBugPattern(pattern: string, context: string): Promise<void> {
  const mem = await loadOnyxMem();

  if (!mem) {
    // Graceful degradation — log to console if mem is unavailable
    console.log(`[onyx-swe:bug-pattern] ${pattern} | context: ${context}`);
    return;
  }

  const key = createPatternKey(pattern);
  const value = JSON.stringify({
    pattern,
    context,
    timestamp: new Date().toISOString(),
  });

  await mem.store(key, value, MEM_MODE);
}

/**
 * Retrieve all stored bug patterns for injection into future SWE sessions.
 *
 * @returns Array of bug pattern strings ready for LLM context injection
 */
export async function getBugPatterns(): Promise<string[]> {
  const mem = await loadOnyxMem();

  if (!mem) {
    return [];
  }

  try {
    const records = await mem.retrieve('bug-pattern:', MEM_MODE);

    return records
      .map((r) => {
        try {
          const parsed = JSON.parse(r.value) as {
            pattern: string;
            context: string;
            timestamp: string;
          };
          return `- [${parsed.context}] ${parsed.pattern}`;
        } catch {
          return `- ${r.value}`;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Format bug patterns for injection into a system prompt.
 * Returns empty string if no patterns are stored.
 */
export async function formatBugPatternsForPrompt(): Promise<string> {
  const patterns = await getBugPatterns();
  if (patterns.length === 0) return '';

  return [
    '## Known Bug Patterns (from previous sessions)',
    'Avoid these patterns — they have caused issues before:',
    ...patterns,
    '',
  ].join('\n');
}