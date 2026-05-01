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
/** Reserved system topics that cannot be used by user packages. */
export const SYSTEM_TOPICS = new Set([
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
 * Factory: create a new OnyxMessage with auto-generated id and timestamp.
 */
export function createMessage(params) {
    if (isSystemTopic(params.topic)) {
        throw new Error(`createMessage: topic "${params.topic}" is reserved for system use`);
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
export function routeMessage(message, rules) {
    for (const rule of rules) {
        if (rule.matches(message)) {
            const resolution = rule.resolve(message);
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
export function isSystemTopic(topic) {
    return SYSTEM_TOPICS.has(topic);
}
//# sourceMappingURL=messaging.js.map