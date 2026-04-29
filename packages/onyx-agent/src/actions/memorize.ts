import { Action, ActionResult, IAgentRuntime, Memory, State } from "@elizaos/core";

export const memorizeAction: Action = {
  name: "STORE_MEMORY",
  similes: ["REMEMBER", "SAVE", "MEMORIZE", "STORE_FACT", "NOTE"],
  description: "Stores a piece of information in ONYX persistent memory",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return text.includes("remember") || text.includes("memorize") || text.includes("save this") || text.includes("note that") || text.includes("store");
  },
  handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
    const text = (message.content?.text || "").toLowerCase();
    const extractedFact = text
      .replace(/remember|memorize|save this|note that|store/gi, "")
      .trim();
    if (!extractedFact) {
      if (callback) await callback({ text: "Nothing to store. Please specify what to remember." });
      return { text: "Nothing to store. Please specify what to remember.", success: false };
    }
    try {
      await runtime.createMemory({
        content: { text: extractedFact },
        entityId: message.entityId!,
        roomId: message.roomId!,
        agentId: runtime.agentId,
      }, "facts", true);
      if (callback) await callback({ text: "Stored in memory: " + extractedFact });
      return { text: "Stored in memory: " + extractedFact, success: true };
    } catch (error) {
      if (callback) await callback({ text: "Failed to store memory: " + (error as Error).message });
      return { text: "Failed to store memory: " + (error as Error).message, success: false };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Remember that my trading wallet is 7x..." } },
      { name: "assistant", content: { text: "Stored in memory: my trading wallet is 7x..." } }
    ],
    [
      { name: "user", content: { text: "Note that I prefer USDC for stablecoin trades" } },
      { name: "assistant", content: { text: "Stored in memory: I prefer USDC for stablecoin trades" } }
    ]
  ]
} as Action;