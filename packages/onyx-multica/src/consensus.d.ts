/**
 * consensus.ts
 * Weighted voting — pure, stateless tally function.
 *
 * tallyVotes(votes) → CouncilDecision
 *
 * A proposal is APPROVED if yesWeight > noWeight (strict majority).
 * Ties resolve to REJECTED (conservative default — safety-first).
 */
export interface Vote {
    agentId: string;
    weight: number;
    decision: boolean;
}
export interface CouncilDecision {
    /** True if weighted yes votes strictly exceed weighted no votes. */
    approved: boolean;
    /** Sum of all votes cast (yes + no). Abstentions excluded. */
    totalWeight: number;
    /** Sum of yes-vote weights. */
    yesWeight: number;
    /** Sum of no-vote weights. */
    noWeight: number;
}
/**
 * Tally an array of weighted votes into a CouncilDecision.
 *
 * @param votes - Array of votes. Empty array → approved: true with zero weight
 *                (vacuous council unanimity).
 */
export declare function tallyVotes(votes: ReadonlyArray<Vote>): CouncilDecision;
//# sourceMappingURL=consensus.d.ts.map