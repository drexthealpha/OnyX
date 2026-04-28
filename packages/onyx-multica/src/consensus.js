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