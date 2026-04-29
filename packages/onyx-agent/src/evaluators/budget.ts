import { ActionResult, Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";

export const budgetCheckEvaluator: Evaluator = {
  alwaysRun: true,
  name: "budget-check",
  description: "Checks if the agent's response has stayed within budget constraints",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    return !!runtime.getSetting?.("BUDGET_USD");
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<ActionResult | undefined> => {
    const budgetStr = runtime.getSetting?.("BUDGET_USD") ?? "0";
    const budget = parseFloat(budgetStr as string);
    const actions = await runtime.getMemories({
      roomId: message.roomId!,
      tableName: "actions",
      count: 1000,
    });
    const estimatedSpend = actions.length * 0.001;
    const logger = runtime.logger;
    if (estimatedSpend > budget) {
      if (logger?.warn) logger.warn("Budget exceeded: " + estimatedSpend.toFixed(4) + " USD used vs " + budget + " USD budget");
    }
    await runtime.createMemory({
      content: { text: "Budget check: " + estimatedSpend.toFixed(4) + " / " + budget + " USD used" },
      entityId: message.entityId!,
      roomId: message.roomId!,
      agentId: runtime.agentId,
    }, "facts");
    return;
  },
  examples: []
};