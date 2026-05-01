/**
 * council.ts
 * Multi-agent council — deliberation engine.
 *
 * join(agentId, weight)          — register an agent member with voting weight.
 * propose(topic, payload)        — broadcast to all members, collect votes,
 *                                   return a CouncilDecision (weighted majority).
 *
 * Proposal timeout: 30 seconds. Agents that do not respond within the window
 * are counted as abstentions (no vote). The proposal resolves to whatever
 * weight was collected before timeout.
 *
 * Agents respond by calling the resolve function passed to their handler.
 * Handlers are registered via the Herald under the topic
 * "council.proposal.<proposalId>".
 */
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
    /**
     * Register (or re-register) an agent in this council with the given weight.
     * Weights must be > 0. Registering an existing agentId overwrites the weight.
     */
    join(agentId, weight) {
        if (weight <= 0) {
            throw new RangeError(`Council.join: weight must be > 0, got ${weight} for agent "${agentId}"`);
        }
        this.members.set(agentId, { agentId, weight });
    }
    /**
     * Remove an agent from this council.
     */
    leave(agentId) {
        this.members.delete(agentId);
    }
    /**
     * List all current members (snapshot).
     */
    listMembers() {
        return [...this.members.values()];
    }
    /**
     * Propose a topic to all joined agents.
     *
     * 1. Creates a unique proposal ID.
     * 2. Publishes "council.proposal.<proposalId>" on the Herald.
     * 3. Waits up to 30 s for all agents to respond.
     * 4. Tallies weighted votes and returns a CouncilDecision.
     *
     * Agents that registered a handler for "council.proposal.<proposalId>"
     * (or a wildcard listener set up via their own subscribe) must call
     * event.respond(agentId, boolean) to cast a vote.
     */
    async propose(topic, payload) {
        const proposalId = nextProposalId();
        const members = [...this.members.values()];
        if (members.length === 0) {
            // No members — vacuous approval with zero weight.
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
                    // All members responded — no need to wait for timeout.
                    settled = true;
                    clearTimeout(timeoutHandle);
                    cleanup();
                    resolve(tallyVotes(votes));
                }
            };
            const event = { proposal, respond };
            const cleanup = this.herald.subscribe(`council.proposal.${proposalId}`, () => { });
            // Broadcast the proposal event to all listening agents.
            // Agents that want to participate subscribe to "council.proposal.*" or
            // to a specific proposal topic on the herald.
            this.herald.publish(`council.proposal.${proposalId}`, event);
        });
    }
}
/**
 * Factory — creates a new Council backed by the given herald (default: globalHerald).
 */
export function createCouncil(herald) {
    return new Council(herald);
}
//# sourceMappingURL=council.js.map