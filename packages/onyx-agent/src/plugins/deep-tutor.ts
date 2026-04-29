import { Plugin, Action, Provider, IAgentRuntime, Memory, State, ActionResult, ModelType, ProviderResult } from "@elizaos/core";

export const learnerProfileProvider: Provider = {
  name: "learner-profile",
  position: 15,
  description: "Provides learner profile information from stored goals",
  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> => {
    const goals = await runtime.getMemories({
      roomId: message.roomId!,
      tableName: "goals",
      count: 10,
    });
    const topics = goals.filter((g: any) => g.content?.text?.startsWith("learning:")).map((g: any) => g.content.text.replace("learning:", "").trim());
    return { text: "Learner profile:\n" + topics.join(", "), values: { topics: topics as string[] } };
  }
};

export const checkProgressAction: Action = {
  name: "CHECK_LEARNING_PROGRESS",
  similes: ["MY_PROGRESS", "WHAT_HAVE_I_LEARNED"],
  description: "Retrieves learning progress from stored goals",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return text.includes("my progress") || text.includes("what have i learned");
  },
  handler: async (runtime, message, state, options, callback): Promise<ActionResult | undefined> => {
    const goals = await runtime.getMemories({
      roomId: message.roomId!,
      tableName: "goals",
      count: 20,
    });
    const learningGoals = goals.filter((g: any) => g.content?.text?.startsWith("learning:"));
    if (learningGoals.length === 0) {
      if (callback) await callback({ text: "No learning progress recorded yet." });
      return { text: "No learning progress recorded yet.", success: true };
    }
    const summary = await runtime.useModel(ModelType.TEXT_LARGE, {
      prompt: "Summarize the following learning topics in 2-3 sentences: " + learningGoals.map((g: any) => g.content.text).join(", ")
    });
    if (callback) await callback({ text: summary });
    return { text: summary, success: true };
  },
  examples: [
    [
      { name: "user", content: { text: "What have I learned so far?" } },
      { name: "assistant", content: { text: "You have completed lessons on DeFi basics, Solana staking, and privacy protocols." } }
    ]
  ]
} as Action;

export const deepTutorPlugin: Plugin = {
  name: "onyx-deep-tutor",
  description: "Adaptive learner model — tracks topics studied, difficulty level, and generates personalized lessons",
  actions: [checkProgressAction],
  providers: [learnerProfileProvider],
  evaluators: [],
  init: async (_config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const logger = runtime.logger;
    if (logger?.info) logger.info("onyx-deep-tutor: learner model active.");
  }
};