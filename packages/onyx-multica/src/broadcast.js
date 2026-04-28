export class Broadcaster {
    agents = new Map();
    register(agentId, handler) {
        this.agents.set(agentId, handler);
    }
    unregister(agentId) {
        this.agents.delete(agentId);
    }
    registeredAgents() {
        return [...this.agents.keys()];
    }
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