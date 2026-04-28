import { randomUUID } from "crypto";
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
    return {
        message,
        targetLayers: [],
        targetAgentIds: [],
        priority: 0,
    };
}
export function isSystemTopic(topic) {
    return SYSTEM_TOPICS.has(topic);
}
//# sourceMappingURL=messaging.js.map