import { Provider, ProviderResult, IAgentRuntime, Memory } from "@elizaos/core";

export const memoryStateProvider: Provider = {
  name: "memory-state",
  position: 5,
  description: "Injects recent facts and goals from ONYX persistent memory into context",
  get: async (runtime: IAgentRuntime, message: Memory): Promise<ProviderResult> => {
    const facts = await runtime.getMemories({
      roomId: message.roomId,
      tableName: "facts",
      count: 5,
    });
    const goals = await runtime.getMemories({
      roomId: message.roomId,
      tableName: "goals",
      count: 3,
    });
    const factTexts = facts.map(f => f.content.text).join("\n- ");
    const goalTexts = goals.map(g => g.content.text).join("\n- ");
    const formatted = "Recent facts:\n" + (factTexts ? "- " + factTexts : "None") + "\n\nActive goals:\n" + (goalTexts ? "- " + goalTexts : "None");
    return { text: formatted, values: { facts: factTexts, goals: goalTexts } };
  }
};