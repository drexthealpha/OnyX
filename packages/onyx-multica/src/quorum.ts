export interface QuorumOptions {
  threshold: number;
  operationFn: () => Promise<void>;
  timeoutMs?: number;
  getWeight?: (agentId: string) => number;
}

export interface QuorumHandle {
  checkIn: (agentId: string) => void;
  readonly currentWeight: number;
}

const ABORT_CODE_TIMEOUT = "TIMEOUT";

export function requireQuorum(options: QuorumOptions): {
  promise: Promise<void>;
  handle: QuorumHandle;
} {
  const {
    threshold,
    operationFn,
    timeoutMs = 30_000,
    getWeight = () => 1,
  } = options;

  if (threshold <= 0) {
    throw new RangeError(`requireQuorum: threshold must be > 0, got ${threshold}`);
  }

  let currentWeight = 0;
  const checkedIn = new Set<string>();
  let settled = false;
  let resolveQuorum!: () => void;
  let rejectQuorum!: (err: unknown) => void;

  const quorumReached = new Promise<void>((res, rej) => {
    resolveQuorum = res;
    rejectQuorum = rej;
  });

  const timeoutHandle = setTimeout(() => {
    if (settled) return;
    settled = true;

    rejectQuorum(
      new Error(
        `requireQuorum: timeout after ${timeoutMs}ms — ` +
          `only ${currentWeight}/${threshold} weight reached`,
      ),
    );
  }, timeoutMs);

  const handle: QuorumHandle = {
    checkIn(agentId: string): void {
      if (settled) return;
      if (checkedIn.has(agentId)) return;

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