export type TopicPattern = string;
export declare const SYSTEM_TOPICS: Set<string>;
export interface OnyxMessage<TPayload = unknown> {
    id: string;
    topic: string;
    source: string;
    timestamp: string;
    payload: TPayload;
    correlationId?: string;
}
export interface MessageEnvelope<TPayload = unknown> {
    message: OnyxMessage<TPayload>;
    targetLayers: string[];
    targetAgentIds: string[];
    priority: number;
    ttlMs?: number;
}
export interface RoutingRule {
    name: string;
    matches: (message: OnyxMessage) => boolean;
    resolve: (message: OnyxMessage) => {
        targetLayers: string[];
        targetAgentIds: string[];
        priority?: number;
    };
}
export declare function createMessage<TPayload = unknown>(params: {
    topic: string;
    source: string;
    payload: TPayload;
    correlationId?: string;
}): OnyxMessage<TPayload>;
export declare function routeMessage<TPayload = unknown>(message: OnyxMessage<TPayload>, rules: RoutingRule[]): MessageEnvelope<TPayload>;
export declare function isSystemTopic(topic: string): boolean;
//# sourceMappingURL=messaging.d.ts.map