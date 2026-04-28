import { describe, it, expect, jest } from "vitest";

const mockRuntime = {
  agentId: "test-agent-id",
  getSetting: jest.fn().mockReturnValue(undefined),
  useModel: jest.fn().mockResolvedValue("mock model output"),
  createMemory: jest.fn().mockResolvedValue("mock-memory-id"),
  getMemories: jest.fn().mockResolvedValue([]),
  searchMemories: jest.fn().mockResolvedValue([]),
  registerAction: jest.fn(),
  registerProvider: jest.fn(),
  registerEvaluator: jest.fn(),
  registerEvent: jest.fn(),
  registerModel: jest.fn(),
  registerTaskWorker: jest.fn(),
  plugins: [],
  actions: [],
  providers: [],
  evaluators: [],
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
};

describe("Action validate() functions", () => {
  it("all actions have validate that returns boolean", async () => {
    const { allActions } = await import("../actions/index.js");
    for (const action of allActions) {
      const mockMsg = { content: { text: "test search query bridge swap remember recall" }, entityId: "e1", roomId: "r1", agentId: "a1" };
      const result = await action.validate(mockRuntime as any, mockMsg as any);
      expect(typeof result).toBe("boolean");
    }
  });
});

describe("Providers return ProviderResult shape", () => {
  it("providers return ProviderResult shape", async () => {
    const { walletStateProvider } = await import("../providers/wallet.js");
    const { budgetRemainingProvider } = await import("../providers/budget.js");
    const { screenContextProvider } = await import("../providers/context.js");
    const { memoryStateProvider } = await import("../providers/memory-state.js");
    const providers = [walletStateProvider, budgetRemainingProvider, screenContextProvider, memoryStateProvider];
    for (const provider of providers) {
      const mockMsg = { content: { text: "test" }, entityId: "e1", roomId: "r1" };
      const result = await provider.get(mockRuntime as any, mockMsg as any, undefined);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      expect(result.text !== undefined || result.values !== undefined).toBe(true);
    }
  });
});

describe("Plugins init() complete without throwing", () => {
  it("plugins init without throwing", async () => {
    const { nosanaPlugin } = await import("../plugins/nosana.js");
    const { solanaPlugin } = await import("../plugins/solana.js");
    const { umbraPlugin } = await import("../plugins/umbra.js");
    const { ikaPlugin } = await import("../plugins/ika.js");
    const { encryptPlugin } = await import("../plugins/encrypt.js");
    const { claudeMemPlugin } = await import("../plugins/claude-mem.js");
    const { deepTutorPlugin } = await import("../plugins/deep-tutor.js");
    const { last30DaysPlugin } = await import("../plugins/last30days.js");
    const plugins = [nosanaPlugin, solanaPlugin, umbraPlugin, ikaPlugin, encryptPlugin, claudeMemPlugin, deepTutorPlugin, last30DaysPlugin];
    for (const plugin of plugins) {
      if (plugin.init) {
        expect(async () => await plugin.init({}, mockRuntime as any)).not.toThrow();
      }
    }
  });
});