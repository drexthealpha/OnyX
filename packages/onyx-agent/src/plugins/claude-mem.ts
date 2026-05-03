import { Plugin, Action, Evaluator, IAgentRuntime, Memory, State, ActionResult, stringToUuid } from "@elizaos/core";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export const restoreMemoriesAction: Action = {
  name: "RESTORE_MEMORIES",
  similes: ["LOAD_MEMORIES", "RELOAD_MEMORIES"],
  description: "Restores persisted memories from disk into runtime memory",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return text.includes("restore memories") || text.includes("load memories");
  },
  handler: async (runtime, message, state, options, callback): Promise<ActionResult | undefined> => {
    const memPath = process.env['CLAUDE_MEM_PATH'] ?? "./data/claude-mem.json";
    try {
      if (!existsSync(memPath)) {
        if (callback) await callback({ text: "No persisted memories found." });
        return { text: "No persisted memories found.", success: false };
      }
      const data = JSON.parse(readFileSync(memPath, "utf-8")) as Array<{ content: { text: string }; tableName: string }>;
      let count = 0;
      for (const entry of data) {
        await runtime.createMemory({
          content: { text: entry.content.text },
          entityId: message.entityId!,
          roomId: message.roomId!,
          agentId: runtime.agentId,
        }, entry.tableName, true);
        count++;
      }
      if (callback) await callback({ text: "Restored " + count + " memories." });
      return { text: "Restored " + count + " memories.", success: true };
    } catch (error) {
      if (callback) await callback({ text: "Failed to restore memories: " + (error as Error).message });
      return { text: "Failed to restore memories: " + (error as Error).message, success: false };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Restore my memories" } },
      { name: "assistant", content: { text: "Restored 5 memories." } }
    ]
  ]
} as Action;

export const persistMemoriesEvaluator: Evaluator = {
  alwaysRun: true,
  name: "persist-memories",
  description: "Saves FACT memories to disk after each response",
  validate: async (): Promise<boolean> => {
    return true;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<ActionResult | undefined> => {
    const memPath = process.env['CLAUDE_MEM_PATH'] ?? "./data/claude-mem.json";
    const logger = runtime.logger;
    try {
      const memories = await runtime.getMemories({
        roomId: message.roomId!,
        tableName: "facts",
        count: 20,
      });
      const toSave = memories.map(m => ({ content: { text: m.content?.text || "" }, tableName: "facts" }));
      try {
        writeFileSync(memPath, JSON.stringify(toSave, null, 2));
      } catch {}
    } catch (error) {
      if (logger?.warn) logger.warn("Memory persistence failed: " + (error as Error).message);
    }
    return;
  },
  examples: []
};

export const claudeMemPlugin: Plugin = {
  name: "onyx-claude-mem",
  description: "Cross-session persistent memory plugin — saves and restores key memories across agent restarts",
  actions: [restoreMemoriesAction],
  providers: [],
  evaluators: [persistMemoriesEvaluator],
  init: async (_config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const memPath = process.env['CLAUDE_MEM_PATH'] ?? "./data/claude-mem.json";
    const logger = runtime.logger;
    try {
      if (!existsSync(memPath)) {
        if (logger?.info) logger.info("onyx-claude-mem: No existing memories to load.");
        return;
      }
      const data = JSON.parse(readFileSync(memPath, "utf-8")) as Array<{ content: { text: string }; tableName: string }>;
      if (logger?.info) logger.info("onyx-claude-mem: Loading " + data.length + " persisted memories.");
      for (const entry of data) {
        await runtime.createMemory({
          content: { text: entry.content.text },
          agentId: runtime.agentId,
          roomId: stringToUuid("00000000-0000-0000-0000-000000000000"),
          entityId: stringToUuid("00000000-0000-0000-0000-000000000000"),
        }, entry.tableName, true);
      }
    } catch (error) {
      if (logger?.warn) logger.warn("onyx-claude-mem: Failed to load persisted memories: " + (error as Error).message);
    }
  }
};