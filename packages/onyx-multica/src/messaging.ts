/**
 * messaging.ts
 * Message format and routing helpers.
 *
 * OnyxMessage — the canonical wire format for all inter-layer messages.
 * MessageEnvelope — wraps OnyxMessage with routing metadata.
 * createMessage() — factory with auto-generated id + timestamp.
 * routeMessage() — applies routing rules to determine target layers/agents.
 * isSystemTopic() — guard for reserved system topics.
 * SYSTEM_TOPICS — set of reserved topic strings.
 */

import { randomUUID } from "crypto";

// Topics use dot-separated hierarchical naming:
//   "<layer>.<entity>.<event>"

export type TopicPattern = string;

/** Reserved system topics that cannot be used by user packages. */
export const SYSTEM_TOPICS = new Set<string>([
  "kernel.abort.called",
  "kernel.law.violated",
  "council.proposal.submitted",
  "council.decision.rendered",
  "herald.subscriber.added",
  "herald.subscriber.removed",
  "onyx.shutdown",
  "onyx.ready",
]);

/**
 * The canonical inter-layer message format.
 */
export interface OnyxMessage<TPayload = unknown> {
  /** Unique message identifier (UUID v4). */
  id: string;
  /** Dot-separated topic string. */
  topic: string;
  /** Originating layer (e.g. "L1", "L3", "kernel"). */
  source: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Arbitrary payload — consumers type-narrow on `topic`. */
  payload: TPayload;
  /** Optional: correlation ID linking related messages. */
  correlationId?: string;
}

/**
 * Wraps an OnyxMessage with routing metadata for targeted delivery.
 */
export interface MessageEnvelope<TPayload = unknown> {
  message: OnyxMessage<TPayload>;
  /** Target layer identifiers (e.g. ["L2", "L3"]). Empty = broadcast to all. */
  targetLayers: string[];
  /** Target agent IDs. Empty = all agents in target layers. */
  targetAgentIds: string[];
  /** Priority: higher = delivered first when queued. Default 0. */
  priority: number;
  /** TTL in milliseconds. Message is discarded after this age. */
  ttlMs?: number;
}

/**
 * A routing rule: if `matches(message)` returns true, `resolve` is applied
 * to determine the target layers and agent IDs.
 */
export interface RoutingRule {
  /** Human-readable rule name (for debugging). */
  name: string;
  matches: (message: OnyxMessage) => boolean;
  resolve: (message: OnyxMessage) => {
    targetLayers: string[];
    targetAgentIds: string[];
    priority?: number;
  };
}

/**
 * Factory: create a new OnyxMessage with auto-generated id and timestamp.
 */
export function createMessage<TPayload = unknown>(params: {
  topic: string;
  source: string;
  payload: TPayload;
  correlationId?: string;
}): OnyxMessage<TPayload> {
  if (isSystemTopic(params.topic)) {
    throw new Error(
      `createMessage: topic "${params.topic}" is reserved for system use`,
    );
  }
  return {
    id: randomUUID(),
    topic: params.topic,
    source: params.source,
    timestamp: new Date().toISOString(),
    payload: params.payload,
    ...(params.correlationId !== undefined
      ? { correlationId: params.correlationId }
      : {}),
  };
}

/**
 * Apply routing rules to an OnyxMessage and return a MessageEnvelope.
 * Rules are applied in order; the FIRST matching rule wins.
 * If no rule matches, the message is broadcast to all (empty target arrays).
 */
export function routeMessage<TPayload = unknown>(
  message: OnyxMessage<TPayload>,
  rules: RoutingRule[],
): MessageEnvelope<TPayload> {
  for (const rule of rules) {
    if (rule.matches(message as OnyxMessage)) {
      const resolution = rule.resolve(message as OnyxMessage);
      return {
        message,
        targetLayers: resolution.targetLayers,
        targetAgentIds: resolution.targetAgentIds,
        priority: resolution.priority ?? 0,
      };
    }
  }

  // Default: broadcast to all.
  return {
    message,
    targetLayers: [],
    targetAgentIds: [],
    priority: 0,
  };
}

/**
 * Guard: returns true if `topic` is in the reserved SYSTEM_TOPICS set.
 */
export function isSystemTopic(topic: string): boolean {
  return SYSTEM_TOPICS.has(topic);
}