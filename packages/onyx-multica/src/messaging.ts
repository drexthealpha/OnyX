import { randomUUID } from "crypto";

export type TopicPattern = string;

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

  return {
    message,
    targetLayers: [],
    targetAgentIds: [],
    priority: 0,
  };
}

export function isSystemTopic(topic: string): boolean {
  return SYSTEM_TOPICS.has(topic);
}