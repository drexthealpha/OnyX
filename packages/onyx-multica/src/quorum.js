/**
 * quorum.ts
 * Quorum-gated operation wrapper.
 */
export function requireQuorum(options) {
    const { threshold, operationFn, timeoutMs = 30_000, getWeight = () => 1, } = options;
    if (threshold <= 0) {
        throw new RangeError(`requireQuorum: threshold must be > 0, got ${threshold}`);
    }
    let currentWeight = 0;
    const checkedIn = new Set();
    let settled = false;
    let resolveQuorum;
    let rejectQuorum;
    const quorumReached = new Promise((res, rej) => {
        resolveQuorum = res;
        rejectQuorum = rej;
    });
    const timeoutHandle = setTimeout(() => {
        if (settled)
            return;
        settled = true;
        rejectQuorum(new Error(`requireQuorum: timeout after ${timeoutMs}ms — ` +
            `only ${currentWeight}/${threshold} weight reached`));
    }, timeoutMs);
    const handle = {
        checkIn(agentId) {
            if (settled)
                return;
            if (checkedIn.has(agentId))
                return;
            checkedIn.add(agentId);
            currentWeight += getWeight(agentId);
            if (currentWeight >= threshold) {
                settled = true;
                clearTimeout(timeoutHandle);
                resolveQuorum();
            }
        },
        get currentWeight() {
            return currentWeight;
        },
    };
    const promise = quorumReached.then(operationFn);
    return { promise, handle };
}
//# sourceMappingURL=quorum.js.map