// packages/onyx-persona/src/context.ts
// ConversationContext type and helpers for context analysis.

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ConversationContext {
  /** Full ordered message history for this session. */
  messages: Message[];
  /** Optional topic hint set by upstream orchestration. */
  topic?: string;
  /** Optional locale / language code, e.g. "en-US". */
  locale?: string;
  /** Any extra metadata the caller wants to attach. */
  meta?: Record<string, unknown>;
}

/**
 * Extracts all unique, lowercased words from the conversation context.
 * Combines content from all messages plus optional topic field.
 */
export function extractKeywords(context: ConversationContext): Set<string> {
  const parts: string[] = [];

  for (const msg of context.messages) {
    parts.push(msg.content);
  }
  if (context.topic) {
    parts.push(context.topic);
  }

  const raw = parts.join(' ').toLowerCase();
  // Split on any non-alphanumeric character, filter empties
  const tokens = raw.split(/[^a-z0-9]+/).filter(Boolean);
  return new Set(tokens);
}

/**
 * Returns the plain text of the most recent N messages concatenated.
 * Useful for recency-weighted trigger matching.
 */
export function recentText(context: ConversationContext, n = 5): string {
  return context.messages
    .slice(-n)
    .map((m) => m.content)
    .join(' ')
    .toLowerCase();
}

/**
 * Checks whether any of the supplied trigger keywords appear in the context.
 * Matches whole tokens (word-boundary aware via Set lookup).
 */
export function analyzeContext(
  context: ConversationContext,
  triggers: string[]
): boolean {
  const keywords = extractKeywords(context);
  return triggers.some((trigger) => {
    // Support multi-word triggers like "how does" via substring match on recent text
    if (trigger.includes(' ')) {
      return recentText(context).includes(trigger.toLowerCase());
    }
    return keywords.has(trigger.toLowerCase());
  });
}