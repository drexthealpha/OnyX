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
export class Broadcaster {
    agents = new Map();
    /**
     * Register `agentId` with a delivery handler.
     * Registering the same agentId overwrites the previous handler.
     */
    register(agentId, handler) {
        this.agents.set(agentId, handler);
    }
    /**
     * Unregister `agentId`.
     */
    unregister(agentId) {
        this.agents.delete(agentId);
    }
    /**
     * Return IDs of all currently registered agents.
     */
    registeredAgents() {
        return [...this.agents.keys()];
    }
    /**
     * Deliver `message` concurrently to all registered agents.
     * Never throws — failures are captured per-agent in the result array.
     */
    async broadcast(message) {
        const entries = [...this.agents.entries()];
        const settled = await Promise.allSettled(entries.map(([, handler]) => handler(message)));
        return entries.map(([agentId], idx) => {
            const result = settled[idx];
            if (result.status === "fulfilled") {
                return { agentId, status: "fulfilled" };
            }
            return { agentId, status: "rejected", error: result.reason };
        });
    }
    /**
     * Deliver to a specific subset of agents by ID.
     * Unknown IDs are silently skipped.
     */
    async broadcastTo(agentIds, message) {
        const targets = agentIds.filter((id) => this.agents.has(id));
        const settled = await Promise.allSettled(targets.map((id) => this.agents.get(id)(message)));
        return targets.map((agentId, idx) => {
            const result = settled[idx];
            if (result.status === "fulfilled") {
                return { agentId, status: "fulfilled" };
            }
            return { agentId, status: "rejected", error: result.reason };
        });
    }
}
export function createBroadcaster() {
    return new Broadcaster();
}
//# sourceMappingURL=broadcast.js.map