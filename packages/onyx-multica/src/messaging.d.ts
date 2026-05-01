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
export type TopicPattern = string;
/** Reserved system topics that cannot be used by user packages. */
export declare const SYSTEM_TOPICS: Set<string>;
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
export declare function createMessage<TPayload = unknown>(params: {
    topic: string;
    source: string;
    payload: TPayload;
    correlationId?: string;
}): OnyxMessage<TPayload>;
/**
 * Apply routing rules to an OnyxMessage and return a MessageEnvelope.
 * Rules are applied in order; the FIRST matching rule wins.
 * If no rule matches, the message is broadcast to all (empty target arrays).
 */
export declare function routeMessage<TPayload = unknown>(message: OnyxMessage<TPayload>, rules: RoutingRule[]): MessageEnvelope<TPayload>;
/**
 * Guard: returns true if `topic` is in the reserved SYSTEM_TOPICS set.
 */
export declare function isSystemTopic(topic: string): boolean;
//# sourceMappingURL=messaging.d.ts.map