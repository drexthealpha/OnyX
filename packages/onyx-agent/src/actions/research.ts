import { Action, ActionResult, HandlerCallback, HandlerOptions, IAgentRuntime, Memory, State, ModelType } from "@elizaos/core";

export const researchAction: Action = {
  name: "DEEP_RESEARCH",
  similes: ["RESEARCH", "INVESTIGATE", "ANALYZE", "STUDY"],
  description: "Performs deep research on a topic using the ONYX research module",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes("research") || text.includes("investigate") || text.includes("analyze") || text.includes("find out about");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const response = await runtime.fetch?.("http://localhost:" + (process.env.RESEARCH_PORT ?? "5050") + "/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message.content.text,
          agentId: runtime.agentId,
        }),
      });
      if (response?.ok) {
        const data = await response.json() as { summary?: string };
        const summary = data.summary || "Research complete.";
        await runtime.createMemory({
          content: { text: summary },
          entityId: message.entityId,
          roomId: message.roomId,
          agentId: runtime.agentId,
        }, "documents");
        return callback({ text: summary, success: true });
      } else {
        const fallback = await runtime.useModel(ModelType.TEXT_LARGE, {
          prompt: "Provide a concise research summary on: " + message.content.text
        });
        return callback({ text: fallback, success: true });
      }
    } catch (error) {
      const fallback = await runtime.useModel(ModelType.TEXT_LARGE, {
        prompt: "Provide a concise research summary on: " + message.content.text
      });
      return callback({ text: fallback, success: true });
    }
  },
  examples: [
    [
      { role: "user", content: { text: "Research Jupiter DEX aggregator" } },
      { role: "assistant", content: { text: "Jupiter is Solana's largest DEX aggregator, routing swaps across Raydium, Orca, and Jupiter's own liquidity pools for optimal rates." } }
    ],
    [
      { role: "user", content: { text: "Analyze the Nosana project" } },
      { role: "assistant", content: { text: "Nosana is a decentralized GPU network enabling分布式 rendering and AI inference. Users can rent GPU time for AI workloads." } }
    ]
  ]
};