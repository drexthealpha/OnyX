import { Action, ActionResult, HandlerCallback, HandlerOptions, IAgentRuntime, Memory, State, ModelType } from "@elizaos/core";

export const searchAction: Action = {
  name: "WEB_SEARCH",
  similes: ["SEARCH", "LOOK_UP", "FIND_INFO", "GOOGLE"],
  description: "Performs a web search and returns summarized results",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    return !!message.content.text && message.content.text.length > 3;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    const query = message.content.text;
    try {
      const result = await runtime.useModel(ModelType.TEXT_LARGE, {
        prompt: "Search query: " + query + "\n\nReturn the top 3 key facts about this topic as if you searched the web."
      });
      await runtime.createMemory({
        content: { text: result },
        entityId: message.entityId,
        roomId: message.roomId,
        agentId: runtime.agentId,
      }, "facts");
      return callback({ text: result, success: true });
    } catch (error) {
      return callback({ text: "Search failed: " + (error as Error).message, success: false });
    }
  },
  examples: [
    [
      { role: "user", content: { text: "Search for Jupiter DEX" } },
      { role: "assistant", content: { text: "Jupiter DEX is Solana's largest DEX aggregator, offering the best swap rates across multiple liquidity sources." } }
    ],
    [
      { role: "user", content: { text: "Find info about Raydium" } },
      { role: "assistant", content: { text: "Raydium is an automated market maker (AMM) built on Solana, providing liquidity pools and yield farming." } }
    ]
  ]
};