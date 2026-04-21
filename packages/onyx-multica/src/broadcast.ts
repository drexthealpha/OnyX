import type { OnyxMessage } from "./messaging.js";

export interface BroadcastResult {
  agentId: string;
  status: "fulfilled" | "rejected";
  error?: unknown;
}

export type BroadcastMessage = OnyxMessage;

export type AgentDeliveryHandler = (message: BroadcastMessage) => Promise<void>;

export class Broadcaster {
  private readonly agents = new Map<string, AgentDeliveryHandler>();

  register(agentId: string, handler: AgentDeliveryHandler): void {
    this.agents.set(agentId, handler);
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  registeredAgents(): string[] {
    return [...this.agents.keys()];
  }

  async broadcast(message: BroadcastMessage): Promise<BroadcastResult[]> {
    const entries = [...this.agents.entries()];

    const settled = await Promise.allSettled(
      entries.map(([, handler]) => handler(message)),
    );

    return entries.map(([agentId], idx) => {
      const result = settled[idx]!;
      if (result.status === "fulfilled") {
        return { agentId, status: "fulfilled" };
      }
      return { agentId, status: "rejected", error: result.reason };
    });
  }

  async broadcastTo(
    agentIds: string[],
    message: BroadcastMessage,
  ): Promise<BroadcastResult[]> {
    const targets = agentIds.filter((id) => this.agents.has(id));

    const settled = await Promise.allSettled(
      targets.map((id) => this.agents.get(id)!(message)),
    );

    return targets.map((agentId, idx) => {
      const result = settled[idx]!;
      if (result.status === "fulfilled") {
        return { agentId, status: "fulfilled" };
      }
      return { agentId, status: "rejected", error: result.reason };
    });
  }
}

export function createBroadcaster(): Broadcaster {
  return new Broadcaster();
}