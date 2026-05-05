// herald — in-process pub/sub event bus
export { Herald, createHerald, globalHerald } from "./herald.js";
export type { HeraldHandler, HeraldUnsubscribe } from "./herald.js";

// council — multi-agent deliberation
export { Council, createCouncil, globalCouncil } from "./council.js";
export type { CouncilMember, CouncilProposal, CouncilDecision } from "./council.js";

// consensus — weighted vote tallying
export { tallyVotes } from "./consensus.js";
export type { Vote } from "./consensus.js";

// quorum — quorum-gated operation wrapper
export { requireQuorum } from "./quorum.js";
export type { QuorumOptions } from "./quorum.js";

// broadcast — fan-out to all registered agents
export { Broadcaster, createBroadcaster } from "./broadcast.js";
export type { BroadcastMessage, BroadcastResult } from "./broadcast.js";

// messaging — canonical message types and routing helpers
export {
  createMessage,
  routeMessage,
  isSystemTopic,
  SYSTEM_TOPICS,
} from "./messaging.js";
export type {
  OnyxMessage,
  MessageEnvelope,
  RoutingRule,
  TopicPattern,
} from "./messaging.js";

// shared-memory — shared state store for agents in same council
export { SharedMemory, createSharedMemory } from "./shared-memory.js";
export type { MemoryEntry, MemorySnapshot } from "./shared-memory.js";

/**
 * Channel Management API (Library Mode)
 */

export async function listChannels() {
  return [
    { id: "broadcast", name: "Broadcast", type: "system" },
    { id: "telemetry", name: "Telemetry", type: "system" },
    { id: "herald", name: "Herald", type: "system" },
  ];
}

export async function createChannel(name?: string, type?: string) {
  return {
    id: `ch-${Date.now()}`,
    name: name ?? "New Channel",
    type: type ?? "custom",
    status: "created",
  };
}

export async function sendMessage(channelId: string, content?: string) {
  const { globalHerald } = await import("./herald.js");
  globalHerald.publish(channelId, {
    type: "message",
    data: { content, timestamp: Date.now() },
  });
  return { ok: true };
}

export async function deleteChannel(id: string) {
  return { ok: true };
}

export async function subscribe(topic: string, callback: (msg: unknown) => void) {
  const { globalHerald } = await import("./herald.js");
  return globalHerald.subscribe(topic, callback);
}