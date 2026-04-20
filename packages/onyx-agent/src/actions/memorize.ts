import { Action, ActionResult, HandlerCallback, HandlerOptions, IAgentRuntime, Memory, State } from "@elizaos/core";

export const memorizeAction: Action = {
  name: "STORE_MEMORY",
  similes: ["REMEMBER", "SAVE", "MEMORIZE", "STORE_FACT", "NOTE"],
  description: "Stores a piece of information in ONYX persistent memory",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes("remember") || text.includes("memorize") || text.includes("save this") || text.includes("note that") || text.includes("store");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    const text = message.content.text.toLowerCase();
    const extractedFact = text
      .replace(/remember|memorize|save this|note that|store/gi, "")
      .trim();
    if (!extractedFact) {
      return callback({ text: "Nothing to store. Please specify what to remember.", success: false });
    }
    try {
      await runtime.createMemory({
        content: { text: extractedFact },
        entityId: message.entityId,
        roomId: message.roomId,
        agentId: runtime.agentId,
      }, "facts", true);
      return callback({ text: "Stored in memory: " + extractedFact, success: true });
    } catch (error) {
      return callback({ text: "Failed to store memory: " + (error as Error).message, success: false });
    }
  },
  examples: [
    [
      { role: "user", content: { text: "Remember that my trading wallet is 7x...", } },
      { role: "assistant", content: { text: "Stored in memory: my trading wallet is 7x...", } }
    ],
    [
      { role: "user", content: { text: "Note that I prefer USDC for stablecoin trades" } },
      { role: "assistant", content: { text: "Stored in memory: I prefer USDC for stablecoin trades" } }
    ]
  ]
};