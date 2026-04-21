// ─────────────────────────────────────────────
// onyx-mem · compress.ts
// Calls Claude API to compress a session buffer into a MemoryCrystal.
// Uses user's ANTHROPIC_API_KEY — zero operator cost.
// ─────────────────────────────────────────────

import type {
  ConversationTelemetry,
  MemoryCrystal,
  MemoryMode,
  CompressionResult,
} from './types.js';
import { getModeHints } from './modes/index.js';
import { MEMORY_CRYSTAL_MAX_TOKENS } from './constants.js';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

// ── Token counting helpers ───────────────────────────────────────────────────

/**
 * Rough token estimator: ~4 characters per token (good enough for budgeting).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function crystalTokenCount(crystal: CompressionResult): number {
  const allText = [
    ...crystal.decisions,
    ...crystal.facts,
    ...crystal.preferences,
    ...crystal.errors,
  ].join(' ');
  return estimateTokens(allText);
}

// ── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(mode: MemoryMode): string {
  const modeHints = getModeHints(mode);

  return [
    'Extract from this conversation session:',
    '1) Key decisions made',
    '2) Facts learned',
    '3) User preferences revealed',
    '4) Errors encountered',
    'Discard boilerplate.',
    'Return JSON with keys: decisions[], facts[], preferences[], errors[].',
    'Each array max 5 items. Each item max 20 words.',
    'Return ONLY valid JSON — no markdown fences, no prose.',
    modeHints ? `\n${modeHints}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// ── Buffer serializer ───────────────────────────────────────────────────────

function serializeBuffer(buffer: ConversationTelemetry[]): string {
  return buffer
    .map(
      (turn) =>
        `[${turn.role.toUpperCase()}] (${new Date(turn.timestamp).toISOString()})\n${turn.content}`,
    )
    .join('\n\n---\n\n');
}

// ── Main compress function ───────────────────────────────────────────────────

/**
 * Compress a session's conversation buffer into a MemoryCrystal.
 *
 * @param sessionId - The gateway session ID
 * @param buffer    - Ordered array of ConversationTelemetry turns
 * @param mode      - Domain mode for compression hints
 * @returns A fully populated MemoryCrystal
 */
export async function compress(
  sessionId: string,
  buffer: ConversationTelemetry[],
  mode: MemoryMode,
): Promise<MemoryCrystal> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new Error(
      '[onyx-mem:compress] ANTHROPIC_API_KEY not set in environment',
    );
  }

  if (buffer.length === 0) {
    // Return an empty crystal — no API call needed.
    return {
      id: crypto.randomUUID(),
      sessionId,
      timestamp: Date.now(),
      mode,
      decisions: [],
      facts: [],
      preferences: [],
      errors: [],
      rawTokenCount: 0,
      compressedTokenCount: 0,
    };
  }

  const conversationText = serializeBuffer(buffer);
  const rawTokenCount = buffer.reduce((acc, t) => acc + (t.tokenCount || estimateTokens(t.content)), 0);

  const requestBody = {
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    system: buildSystemPrompt(mode),
    messages: [
      {
        role: 'user',
        content: conversationText,
      },
    ],
  };

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    throw new Error(`[onyx-mem:compress] Network error calling Claude API: ${err}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[onyx-mem:compress] Claude API error ${response.status}: ${errorText}`,
    );
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const rawText = data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('');

  // Parse JSON — strip any accidental markdown fences.
  let parsed: CompressionResult;
  try {
    const clean = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    parsed = JSON.parse(clean) as CompressionResult;
  } catch {
    console.warn('[onyx-mem:compress] Failed to parse Claude response, using empty crystal. Raw:', rawText);
    parsed = { decisions: [], facts: [], preferences: [], errors: [] };
  }

  // Clamp arrays to max 5 items.
  const clamp = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .slice(0, 5)
      .map((item) => String(item).slice(0, 200)); // safety truncation
  };

  const crystal: MemoryCrystal = {
    id: crypto.randomUUID(),
    sessionId,
    timestamp: Date.now(),
    mode,
    decisions: clamp(parsed.decisions),
    facts: clamp(parsed.facts),
    preferences: clamp(parsed.preferences),
    errors: clamp(parsed.errors),
    rawTokenCount,
    compressedTokenCount: crystalTokenCount(parsed),
  };

  // Warn if crystal exceeds max token budget (shouldn't happen given max 5 × 20-word items).
  if (crystal.compressedTokenCount > MEMORY_CRYSTAL_MAX_TOKENS) {
    console.warn(
      `[onyx-mem:compress] Crystal for session ${sessionId} is ${crystal.compressedTokenCount} tokens (limit: ${MEMORY_CRYSTAL_MAX_TOKENS}). Consider tightening prompts.`,
    );
  }

  return crystal;
}