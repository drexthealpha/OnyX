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
    respond: (agentId: string, decision: boolean) => void;
}
export declare class Council {
    private readonly members;
    private readonly herald;
    constructor(herald?: Herald);
    join(agentId: string, weight: number): void;
    leave(agentId: string): void;
    listMembers(): readonly CouncilMember[];
    propose(topic: string, payload: unknown): Promise<CouncilDecision>;
}
export declare function createCouncil(herald?: Herald): Council;
//# sourceMappingURL=council.d.ts.map