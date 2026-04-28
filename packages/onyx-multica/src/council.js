import { tallyVotes } from "./consensus.js";
import { globalHerald } from "./herald.js";
const PROPOSAL_TIMEOUT_MS = 30_000;
let proposalCounter = 0;
function nextProposalId() {
    return `proposal-${Date.now()}-${++proposalCounter}`;
}
export class Council {
    members = new Map();
    herald;
    constructor(herald = globalHerald) {
        this.herald = herald;
    }
    join(agentId, weight) {
        if (weight <= 0) {
            throw new RangeError(`Council.join: weight must be > 0, got ${weight} for agent "${agentId}"`);
        }
        this.members.set(agentId, { agentId, weight });
    }
    leave(agentId) {
        this.members.delete(agentId);
    }
    listMembers() {
        return [...this.members.values()];
    }
    async propose(topic, payload) {
        const proposalId = nextProposalId();
        const members = [...this.members.values()];
        if (members.length === 0) {
            return { approved: true, totalWeight: 0, yesWeight: 0, noWeight: 0 };
        }
        const votes = [];
        const responded = new Set();
        return new Promise((resolve) => {
            let settled = false;
            const timeoutHandle = setTimeout(() => {
                if (settled)
                    return;
                settled = true;
                cleanup();
                resolve(tallyVotes(votes));
            }, PROPOSAL_TIMEOUT_MS);
            const proposal = {
                id: proposalId,
                topic,
                payload,
                submittedAt: Date.now(),
            };
            const respond = (agentId, decision) => {
                if (settled)
                    return;
                if (!this.members.has(agentId))
                    return;
                if (responded.has(agentId))
                    return;
                responded.add(agentId);
                const member = this.members.get(agentId);
                votes.push({ agentId, weight: member.weight, decision });
                if (responded.size === members.length) {
                    settled = true;
                    clearTimeout(timeoutHandle);
                    cleanup();
                    resolve(tallyVotes(votes));
                }
            };
            const event = { proposal, respond };
            const cleanup = this.herald.subscribe(`council.proposal.${proposalId}`, () => { });
            this.herald.publish(`council.proposal.${proposalId}`, event);
        });
    }
}
export function createCouncil(herald) {
    return new Council(herald);
}
//# sourceMappingURL=council.js.map