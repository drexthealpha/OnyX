import { Evaluator, IAgentRuntime, Memory, State, ModelType } from "@elizaos/core";

export const learningExtractorEvaluator: Evaluator = {
  alwaysRun: false,
  name: "learning-extractor",
  description: "Extracts learning insights from conversations and stores them as FACT memories",
  validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    const responseText = (state?.data?.response as any)?.content?.text as string | undefined;
    return !!(responseText && responseText.length > 100);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<void> => {
    const responseText = (state?.data?.response as any)?.content?.text as string;
    if (!responseText) return;
    const logger = (runtime as any).logger;
    try {
      const prompt = "Extract 1-3 key learnable facts from this AI response: " + responseText + ". Return only facts, one per line.";
      const result = await runtime.useModel(ModelType.TEXT_SMALL, { prompt });
      const facts = result.split("\n").filter((line: string) => line.trim().length > 0);
      for (const fact of facts) {
        if (fact.trim()) {
          await runtime.createMemory({
            content: { text: fact.trim() },
            entityId: message.entityId,
            roomId: message.roomId,
            agentId: runtime.agentId,
          }, "facts", true);
        }
      }
    } catch (error) {
      if (logger?.warn) logger.warn("Learning extraction failed: " + (error as Error).message);
    }
  },
  examples: []
};