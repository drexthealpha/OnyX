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

import { allActions } from "../actions/index.js";
import { walletStateProvider, budgetRemainingProvider, screenContextProvider, memoryStateProvider } from "../providers/index.js";
import { nosanaPlugin, solanaPlugin, umbraPlugin, ikaPlugin, encryptPlugin, claudeMemPlugin, deepTutorPlugin, last30DaysPlugin } from "../plugins/index.js";

describe("Action validate() functions", () => {
  allActions.forEach((action) => {
    it(`${action.name} validate() returns boolean`, async () => {
      const mockMsg = { content: { text: "test search query bridge swap remember recall" }, entityId: "e1", roomId: "r1", agentId: "a1" };
      const result = await action.validate(mockRuntime, mockMsg);
      expect(typeof result).toBe("boolean");
    });
  });
});

describe("Providers return ProviderResult shape", () => {
  const providers = [walletStateProvider, budgetRemainingProvider, screenContextProvider, memoryStateProvider];
  providers.forEach((provider) => {
    it(`${provider.name} get() returns ProviderResult shape`, async () => {
      const mockMsg = { content: { text: "test" }, entityId: "e1", roomId: "r1" };
      const result = await provider.get(mockRuntime, mockMsg, undefined);
      expect(result).toBeDefined();
      expect(typeof result === "object").toBe(true);
      expect(result.text !== undefined || result.values !== undefined).toBe(true);
    });
  });
});

describe("Plugins init() complete without throwing", () => {
  const plugins = [nosanaPlugin, solanaPlugin, umbraPlugin, ikaPlugin, encryptPlugin, claudeMemPlugin, deepTutorPlugin, last30DaysPlugin];
  plugins.forEach((plugin) => {
    it(`${plugin.name} init() completes without throwing`, async () => {
      await expect(plugin.init?.({}, mockRuntime)).resolves.not.toThrow();
    });
  });
});