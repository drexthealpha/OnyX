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
    register(agentId: string, handler: AgentDeliveryHandler): void;
    unregister(agentId: string): void;
    registeredAgents(): string[];
    broadcast(message: BroadcastMessage): Promise<BroadcastResult[]>;
    broadcastTo(agentIds: string[], message: BroadcastMessage): Promise<BroadcastResult[]>;
}
export declare function createBroadcaster(): Broadcaster;
//# sourceMappingURL=broadcast.d.ts.map