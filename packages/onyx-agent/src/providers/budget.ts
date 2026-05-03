import { Provider, ProviderResult, IAgentRuntime, Memory, State } from "@elizaos/core";

export const budgetRemainingProvider: Provider = {
  name: "budget-remaining",
  position: -5,
  description: "Provides the current API budget remaining for this session",
  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> => {
    const budgetStr = runtime.getSetting?.("BUDGET_USD") ?? process.env['BUDGET_USD'] ?? "0";
    const budgetUsd = parseFloat(budgetStr as string);
    const actions = await runtime.getMemories({
      roomId: message.roomId!,
      tableName: "actions",
      count: 100,
    });
    const estimatedSpend = actions.length * 0.001;
    const remaining = Math.max(0, budgetUsd - estimatedSpend);
    return {
      text: "Budget remaining: " + remaining.toFixed(4) + " USD",
      values: { budgetUsd, estimatedSpend, remaining }
    };
  }
};