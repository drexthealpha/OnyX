import { describe, expect, it, vi } from "vitest";
import { requireQuorum } from "./quorum.js";

describe("requireQuorum", () => {
  it("blocks operationFn until threshold weight is met", async () => {
    const order: string[] = [];

    const operationFn = vi.fn(async () => {
      order.push("operation");
    });

    const { promise, handle } = requireQuorum({
      threshold: 3,
      operationFn,
      timeoutMs: 5_000,
      getWeight: (agentId) => (agentId === "heavy" ? 2 : 1),
    });

    handle.checkIn("light");
    expect(operationFn).not.toHaveBeenCalled();

    handle.checkIn("heavy");
    await promise;

    expect(operationFn).toHaveBeenCalledOnce();
    expect(order).toEqual(["operation"]);
  });

  it("is idempotent — duplicate checkIns do not double-count weight", async () => {
    const operationFn = vi.fn(async () => {});

    const { promise, handle } = requireQuorum({
      threshold: 2,
      operationFn,
      timeoutMs: 5_000,
    });

    handle.checkIn("agent-a");
    handle.checkIn("agent-a");
    handle.checkIn("agent-a");

    handle.checkIn("agent-b");
    await promise;

    expect(operationFn).toHaveBeenCalledOnce();
  });

  it("rejects when timeout elapses before threshold is met", async () => {
    vi.useFakeTimers();

    const operationFn = vi.fn(async () => {});

    const { promise, handle } = requireQuorum({
      threshold: 10,
      operationFn,
      timeoutMs: 1_000,
    });

    handle.checkIn("a");

    vi.advanceTimersByTime(1_001);

    await expect(promise).rejects.toThrow(/timeout/i);
    expect(operationFn).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("throws RangeError on threshold <= 0", () => {
    expect(() =>
      requireQuorum({ threshold: 0, operationFn: async () => {} }),
    ).toThrow(RangeError);
  });
});