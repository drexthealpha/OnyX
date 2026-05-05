import { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

export const learnAction: Action = {
  name: "START_TUTOR_SESSION",
  similes: ["LEARN", "TUTOR", "TEACH_ME", "STUDY", "EXPLAIN"],
  description: "Starts an interactive tutor session on a topic using the ONYX tutor module",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return text.includes("learn") || text.includes("teach") || text.includes("tutor") || text.includes("explain how") || text.includes("help me understand");
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options: unknown = {}, callback?: HandlerCallback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    const topic = text.replace(/learn|tutor|teach me|explain how|help me understand/gi, "").trim() || "general topics";
    try {
      await runtime.fetch?.("http://localhost:" + (process.env['TUTOR_PORT'] ?? "5060") + "/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          learnerId: message.entityId,
        }),
      });
      const lessonIntro = "Welcome to your " + topic + " lesson. Let's start with the fundamentals.";
      await runtime.createMemory({
        content: { text: "learning: " + topic },
        entityId: message.entityId!,
        roomId: message.roomId!,
        agentId: runtime.agentId,
      }, "goals");
      if (callback) await callback({ text: lessonIntro });
      return { text: lessonIntro, success: true };
    } catch (error) {
      if (callback) await callback({ text: "Starting lesson on " + topic + ". What would you like to know first?" });
      return { text: "Starting lesson on " + topic + ". What would you like to know first?", success: true };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Teach me about DeFi" } },
      { name: "assistant", content: { text: "Welcome to your DeFi lesson. Let's start with the fundamentals. What would you like to know first?" } }
    ],
    [
      { name: "user", content: { text: "Help me understand Solana staking" } },
      { name: "assistant", content: { text: "Let's explore Solana staking together. I'll guide you through the process step by step." } }
    ]
  ]
} as Action;