import { Plugin, Provider, IAgentRuntime, Memory, ModelType } from "@elizaos/core";

export const recentIntelProvider: Provider = {
  name: "recent-intel",
  position: 50,
  dynamic: true,
  description: "Injects real-time intel — asks the LLM for recent (last 30 days) context on the current topic",
  get: async (runtime: IAgentRuntime, message: Memory): Promise<{ text: string; values: Record<string, unknown> }> => {
    const topic = message.content.text.split(" ").slice(0, 10).join(" ");
    try {
      const result = await runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: "In 2-3 sentences, what are the most relevant developments in the last 30 days regarding: " + topic + "? Be concise and factual."
      });
      return { text: "Recent intel: " + result, values: { topic, intel: result } };
    } catch {
      return { text: "", values: {} };
    }
  }
};

export const last30DaysPlugin: Plugin = {
  name: "onyx-last30days",
  description: "Injects real-time intel — asks the LLM for recent (last 30 days) context on the current topic",
  actions: [],
  providers: [recentIntelProvider],
  evaluators: [],
  init: async (_config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const logger = (runtime as any).logger;
    if (logger?.info) logger.info("onyx-last30days: real-time intel provider active.");
  }
};