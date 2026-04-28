/**
 * council.test.ts
 * Test: Council collects responses from all joined members.
 */
import { describe, expect, it, vi } from "vitest";
import { Council, createCouncil } from "./council.js";
import { createHerald } from "./herald.js";
import type { AgentProposalEvent } from "./council.js";

describe("Council", () => {
  it("collects responses from all joined members and returns weighted decision", async () => {
    const herald = createHerald("test");
    const council = createCouncil(herald);

    council.join("alpha", 2);
    council.join("beta", 1);
    council.join("gamma", 1);

    const agentIds = ["alpha", "beta", "gamma"];
    const votes: Record<string, boolean> = {
      alpha: true,
      beta: true,
      gamma: false,
    };

    const publishSpy = vi.spyOn(herald, "publish");

    let proposalTopic: string | undefined;
    let capturedEvent: AgentProposalEvent | undefined;

    const originalPublish = herald.publish.bind(herald);
    publishSpy.mockImplementation((topic: string, data: unknown) => {
      if (topic.startsWith("council.proposal.")) {
        proposalTopic = topic;
        capturedEvent = data as AgentProposalEvent;
        for (const agentId of agentIds) {
          (data as AgentProposalEvent).respond(agentId, votes[agentId]!);
        }
      }
      return originalPublish(topic, data);
    });

    const decision = await council.propose("deploy:production", { version: "1.2.3" });

    expect(proposalTopic).toMatch(/^council\.proposal\./);
    expect(capturedEvent?.proposal.topic).toBe("deploy:production");

    expect(decision.approved).toBe(true);
    expect(decision.yesWeight).toBe(3);
    expect(decision.noWeight).toBe(1);
    expect(decision.totalWeight).toBe(4);

    publishSpy.mockRestore();
  });

  it("lists all joined members", () => {
    const council = new Council();
    council.join("x", 1);
    council.join("y", 3);
    const members = council.listMembers();
    expect(members).toHaveLength(2);
    expect(members.find((m) => m.agentId === "y")?.weight).toBe(3);
  });

  it("throws if weight <= 0", () => {
    const council = new Council();
    expect(() => council.join("bad", 0)).toThrow(RangeError);
    expect(() => council.join("bad", -1)).toThrow(RangeError);
  });

  it("returns vacuous approval when no members are joined", async () => {
    const council = new Council();
    const decision = await council.propose("anything", null);
    expect(decision.approved).toBe(true);
    expect(decision.totalWeight).toBe(0);
  });
});