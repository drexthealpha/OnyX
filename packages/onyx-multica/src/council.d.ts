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
import type { CouncilDecision, Vote } from "./consensus.js";
import type { Herald } from "./herald.js";
export type { CouncilDecision, Vote };
export interface CouncilMember {
    agentId: string;
    weight: number;
}
export interface CouncilProposal {
    id: string;
    topic: string;
    payload: unknown;
    submittedAt: number;
}
export interface AgentProposalEvent {
    proposal: CouncilProposal;
    /** Agent calls this with true (approve) or false (reject). */
    respond: (agentId: string, decision: boolean) => void;
}
export declare class Council {
    private readonly members;
    private readonly herald;
    constructor(herald?: Herald);
    /**
     * Register (or re-register) an agent in this council with the given weight.
     * Weights must be > 0. Registering an existing agentId overwrites the weight.
     */
    join(agentId: string, weight: number): void;
    /**
     * Remove an agent from this council.
     */
    leave(agentId: string): void;
    /**
     * List all current members (snapshot).
     */
    listMembers(): readonly CouncilMember[];
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
    propose(topic: string, payload: unknown): Promise<CouncilDecision>;
}
/**
 * Factory — creates a new Council backed by the given herald (default: globalHerald).
 */
export declare function createCouncil(herald?: Herald): Council;
//# sourceMappingURL=council.d.ts.map