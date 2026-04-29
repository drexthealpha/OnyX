import { Action, ActionResult, IAgentRuntime, Memory, State, ModelType } from "@elizaos/core";

export const recallAction: Action = {
  name: "SEMANTIC_RECALL",
  similes: ["RECALL", "REMEMBER", "LOOK_UP_MEMORY", "SEARCH_MEMORY", "FIND_IN_MEMORY"],
  description: "Performs semantic search over ONYX memory to recall relevant past information",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return text.includes("recall") || text.includes("do you remember") || text.includes("what did I") || text.includes("look up in memory") || text.includes("search memory");
  },
  handler: async (runtime, message, state, options, callback): Promise<ActionResult | undefined> => {
    try {
      const embedding = await runtime.useModel(ModelType.TEXT_EMBEDDING, {
        text: message.content?.text || ""
      });
      const memories = await runtime.searchMemories({
        tableName: "facts",
        embedding,
        match_threshold: 0.7,
        count: 5,
      });
      if (memories.length === 0) {
        if (callback) await callback({ text: "No relevant memories found." });
        return { text: "No relevant memories found.", success: true };
      }
      const formatted = memories.map((m, i) => (i + 1) + ". " + (m.content?.text || "")).join("\n");
      if (callback) await callback({ text: formatted });
      return { text: formatted, success: true };
    } catch (error) {
      if (callback) await callback({ text: "Memory recall failed: " + (error as Error).message });
      return { text: "Memory recall failed: " + (error as Error).message, success: false };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Do you remember my wallet address?" } },
      { name: "assistant", content: { text: "1. Your wallet address is 7x..." } }
    ],
    [
      { name: "user", content: { text: "What did I tell you about my preferences?" } },
      { name: "assistant", content: { text: "1. You prefer USDC for stablecoin trades\n2. Your trading wallet is 7x..." } }
    ]
  ]
} as Action;