export interface Vote {
    agentId: string;
    weight: number;
    decision: boolean;
}
export interface CouncilDecision {
    approved: boolean;
    totalWeight: number;
    yesWeight: number;
    noWeight: number;
}
export declare function tallyVotes(votes: ReadonlyArray<Vote>): CouncilDecision;
//# sourceMappingURL=consensus.d.ts.map