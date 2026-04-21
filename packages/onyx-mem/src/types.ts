// ─────────────────────────────────────────────
// onyx-mem · types.ts
// Core domain types for the memory system
// ─────────────────────────────────────────────

/**
 * Supported memory compression modes.
 * Each mode adds domain-specific hints to the Claude compression prompt.
 */
export type MemoryMode =
  | 'code--ts'
  | 'code--py'
  | 'code--rust'
  | 'finance'
  | 'research'
  | 'trading';

/**
 * A MemoryCrystal is the compressed, durable artifact produced at session end.
 * It captures the essential signal from a conversation and is stored in
 * both SQLite (fast retrieval) and Qdrant (semantic search).
 */
export interface MemoryCrystal {
  /** UUID, e.g. crypto.randomUUID() */
  id: string;
  /** Maps to the gateway sessionId (ContentSessionId) */
  sessionId: string;
  /** Unix epoch ms when crystal was created */
  timestamp: number;
  /** Domain mode used during compression */
  mode: MemoryMode;
  /** Key decisions made during the session (max 5, max 20 words each) */
  decisions: string[];
  /** Facts learned during the session (max 5, max 20 words each) */
  facts: string[];
  /** User preferences revealed (max 5, max 20 words each) */
  preferences: string[];
  /** Errors encountered (max 5, max 20 words each) */
  errors: string[];
  /** Approximate token count of the raw conversation buffer */
  rawTokenCount: number;
  /** Approximate token count of the compressed crystal */
  compressedTokenCount: number;
}

/**
 * ConversationTelemetry is the shape for ONYX memory capture.
 * Maps to @onyx/gateway's telemetry shape.
 */
export interface ConversationTelemetry {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount: number;
  timestamp: number;
  model?: string;
  message?: unknown;
  channelName?: string;
}

/**
 * Returned by @onyx/semantic search (stub until S09 is live).
 */
export interface SemanticSearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
  content: string;
}

/**
 * Raw JSON returned by the Claude compression API call.
 */
export interface CompressionResult {
  decisions: string[];
  facts: string[];
  preferences: string[];
  errors: string[];
}