/**
 * consensus.ts
 * Weighted voting — pure, stateless tally function.
 *
 * tallyVotes(votes) → CouncilDecision
 *
 * A proposal is APPROVED if yesWeight > noWeight (strict majority).
 * Ties resolve to REJECTED (conservative default — safety-first).
 */
/**
 * Tally an array of weighted votes into a CouncilDecision.
 *
 * @param votes - Array of votes. Empty array → approved: true with zero weight
 *                (vacuous council unanimity).
 */
export function tallyVotes(votes) {
    let yesWeight = 0;
    let noWeight = 0;
    for (const vote of votes) {
        if (vote.weight <= 0) {
            throw new RangeError(`tallyVotes: vote weight must be > 0, got ${vote.weight} for agent "${vote.agentId}"`);
        }
        if (vote.decision) {
            yesWeight += vote.weight;
        }
        else {
            noWeight += vote.weight;
        }
    }
    const totalWeight = yesWeight + noWeight;
    // Empty array case per spec: "Empty array → approved: true"
    if (totalWeight === 0) {
        return {
            approved: true,
            totalWeight: 0,
            yesWeight: 0,
            noWeight: 0,
        };
    }
    return {
        approved: yesWeight > noWeight,
        totalWeight,
        yesWeight,
        noWeight,
    };
}
//# sourceMappingURL=consensus.js.map