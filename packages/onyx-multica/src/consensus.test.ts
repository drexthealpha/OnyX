import { describe, expect, it } from "vitest";
import { tallyVotes } from "./consensus.js";

describe("tallyVotes", () => {
  it("approves when yes weight exceeds no weight", () => {
    const result = tallyVotes([
      { agentId: "a", weight: 3, decision: true },
      { agentId: "b", weight: 1, decision: false },
    ]);
    expect(result.approved).toBe(true);
    expect(result.yesWeight).toBe(3);
    expect(result.noWeight).toBe(1);
    expect(result.totalWeight).toBe(4);
  });

  it("rejects on tie (conservative default)", () => {
    const result = tallyVotes([
      { agentId: "a", weight: 2, decision: true },
      { agentId: "b", weight: 2, decision: false },
    ]);
    expect(result.approved).toBe(false);
  });

  it("rejects when no weight exceeds yes weight", () => {
    const result = tallyVotes([
      { agentId: "a", weight: 1, decision: true },
      { agentId: "b", weight: 5, decision: false },
    ]);
    expect(result.approved).toBe(false);
    expect(result.yesWeight).toBe(1);
    expect(result.noWeight).toBe(5);
  });

  it("returns vacuous approval for empty vote array", () => {
    const result = tallyVotes([]);
    expect(result.approved).toBe(true);
    expect(result.totalWeight).toBe(0);
  });

  it("throws RangeError for a vote with weight <= 0", () => {
    expect(() =>
      tallyVotes([{ agentId: "bad", weight: 0, decision: true }]),
    ).toThrow(RangeError);
  });
});