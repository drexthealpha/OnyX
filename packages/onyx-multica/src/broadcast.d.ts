/**
 * broadcast.ts
 * Broadcaster — fan-out delivery to all registered agent handlers.
 *
 * Agents register a delivery handler via register(agentId, handler).
 * broadcast(message) delivers to all of them concurrently and returns
 * per-agent results (fulfilled | rejected).
 *
 * This is distinct from Herald (which is topic-based pub/sub).
 * Broadcaster is agent-registry-based — you know exactly which agents
 * receive the message.
 */
import type { OnyxMessage } from "./messaging.js";
export interface BroadcastResult {
    agentId: string;
    status: "fulfilled" | "rejected";
    error?: unknown;
}
export type BroadcastMessage = OnyxMessage;
export type AgentDeliveryHandler = (message: BroadcastMessage) => Promise<void>;
export declare class Broadcaster {
    private readonly agents;
    /**
     * Register `agentId` with a delivery handler.
     * Registering the same agentId overwrites the previous handler.
     */
    register(agentId: string, handler: AgentDeliveryHandler): void;
    /**
     * Unregister `agentId`.
     */
    unregister(agentId: string): void;
    /**
     * Return IDs of all currently registered agents.
     */
    registeredAgents(): string[];
    /**
     * Deliver `message` concurrently to all registered agents.
     * Never throws — failures are captured per-agent in the result array.
     */
    broadcast(message: BroadcastMessage): Promise<BroadcastResult[]>;
    /**
     * Deliver to a specific subset of agents by ID.
     * Unknown IDs are silently skipped.
     */
    broadcastTo(agentIds: string[], message: BroadcastMessage): Promise<BroadcastResult[]>;
}
export declare function createBroadcaster(): Broadcaster;
//# sourceMappingURL=broadcast.d.ts.map