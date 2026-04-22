import { describe, it, expect, beforeAll } from "bun:test";
import { app } from "../src/loop.js";
import { compute as computeReward } from "../src/reward/model.js";
import { optimize as runGRPO } from "../src/optimizer/grpo.js";
import type { Trajectory } from "../src/types.js";

// ─── Helper: fake trajectory ──────────────────────────────────────────────────
function makeTraj(overrides: Partial<Trajectory> = {}): Trajectory {
  return {
    id: crypto.randomUUID(),
    conversationId: "conv-test-1",
    message: "What is 2+2?",
    response: "4",
    toolsUsed: [],
    latencyMs: 500,
    tokensUsed: 100,
    timestamp: Date.now(),
    ...overrides,
  };
}

// ─── Test 1: POST /capture returns 200 and trajectory is retrievable ──────────
describe("POST /capture", () => {
  it("returns 200 and a trajectoryId", async () => {
    const res = await app.request("/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: "conv-abc",
        message: "Hello",
        response: "Hi there!",
        toolsUsed: ["search"],
        latencyMs: 300,
        tokensUsed: 50,
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json() as { ok: boolean; trajectoryId: string };
    expect(json.ok).toBe(true);
    expect(typeof json.trajectoryId).toBe("string");
    expect(json.trajectoryId.length).toBeGreaterThan(0);
  });

  it("returns 400 if required fields are missing", async () => {
    const res = await app.request("/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: "x" }), // missing message, response
    });
    expect(res.status).toBe(400);
  });
});

// ─── Test 2: Reward model penalises latency above 2000ms ─────────────────────
describe("Reward model", () => {
  it("penalises latency above 2000ms at -0.1 per second", () => {
    // 4000ms latency = 2000ms excess = -0.2 penalty
    const traj = makeTraj({ latencyMs: 4000 });
    const reward = computeReward(traj, { success: true });

    // base=1.0, latency=-0.2, efficiency=0
    expect(reward.components.latency).toBeCloseTo(-0.2, 5);
    expect(reward.value).toBeCloseTo(0.8, 5);
  });

  it("does not penalise latency under 2000ms", () => {
    const traj = makeTraj({ latencyMs: 1000 });
    const reward = computeReward(traj, { success: true });
    expect(reward.components.latency).toBeCloseTo(0, 5);
    expect(reward.value).toBe(1.0);
  });

  it("penalises token usage above 1000 at -0.01 per 100 tokens", () => {
    // 2000 tokens = 1000 excess = 10 blocks → -0.10
    const traj = makeTraj({ tokensUsed: 2000 });
    const reward = computeReward(traj, { success: true });
    expect(reward.components.efficiency).toBeCloseTo(-0.10, 5);
    expect(reward.value).toBeCloseTo(0.9, 5);
  });

  it("clamps reward to [0, 1] even with heavy penalties", () => {
    const traj = makeTraj({ latencyMs: 100000, tokensUsed: 100000 });
    const reward = computeReward(traj, { success: false });
    expect(reward.value).toBeGreaterThanOrEqual(0);
    expect(reward.value).toBeLessThanOrEqual(1);
  });
});

// ─── Test 3: GRPO returns PolicyUpdate with numeric gradientSignal ───────────
describe("GRPO optimizer", () => {
  it("returns PolicyUpdate with numeric gradientSignal", () => {
    const t1 = makeTraj({ id: "t1", conversationId: "g1", toolsUsed: ["search"] });
    const t2 = makeTraj({ id: "t2", conversationId: "g1", toolsUsed: ["code"] });
    const t3 = makeTraj({ id: "t3", conversationId: "g2", toolsUsed: ["search"] });

    const rewards = [
      { trajectoryId: "t1", value: 0.9, components: { completion: 1, feedback: 0, latency: 0, efficiency: -0.1 } },
      { trajectoryId: "t2", value: 0.3, components: { completion: 0, feedback: -0.5, latency: -0.2, efficiency: 0 } },
      { trajectoryId: "t3", value: 0.7, components: { completion: 1, feedback: 0, latency: -0.3, efficiency: 0 } },
    ];

    const update = runGRPO([t1, t2, t3], rewards);

    expect(typeof update.gradientSignal).toBe("number");
    expect(isFinite(update.gradientSignal)).toBe(true);
    expect(typeof update.timestamp).toBe("number");
    expect(Array.isArray(update.affectedSkills)).toBe(true);
    // t2 is below group mean → "code" should be affected
    expect(update.affectedSkills).toContain("code");
  });

  it("returns zero gradientSignal for empty input", () => {
    const update = runGRPO([], []);
    expect(update.gradientSignal).toBe(0);
    expect(update.affectedSkills).toHaveLength(0);
  });

  it("single trajectory group has zero relative reward", () => {
    const t1 = makeTraj({ id: "solo", conversationId: "solo-conv" });
    const rewards = [{ trajectoryId: "solo", value: 0.8, components: { completion: 1, feedback: 0, latency: -0.2, efficiency: 0 } }];
    const update = runGRPO([t1], rewards);
    // solo group: relative = 0.8 - 0.8 = 0 → gradientSignal = 0
    expect(update.gradientSignal).toBeCloseTo(0, 10);
  });
});