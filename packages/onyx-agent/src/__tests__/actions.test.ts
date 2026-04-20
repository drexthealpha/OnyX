import { describe, it, expect } from "vitest";

const mockRuntime = {
  agentId: "test-agent-id",
  getSetting: (key: string) => undefined,
  useModel: () => Promise.resolve("mock model output"),
  createMemory: () => Promise.resolve("mock-memory-id"),
  getMemories: () => Promise.resolve([]),
  searchMemories: () => Promise.resolve([]),
  registerAction: () => {},
  registerProvider: () => {},
  registerEvaluator: () => {},
  registerEvent: () => {},
  registerModel: () => {},
  registerTaskWorker: () => {},
  plugins: [],
  actions: [],
  providers: [],
  evaluators: [],
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
};

describe("Action validate() functions", () => {
  it("all actions have validate that returns boolean", async () => {
    const { allActions } = await import("../actions/index.js");
    for (const action of allActions) {
      const mockMsg = { content: { text: "test search query bridge swap remember recall browse" }, entityId: "e1", roomId: "r1", agentId: "a1" };
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
        await plugin.init({}, mockRuntime as any);
      }
    }
  });
});