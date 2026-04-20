import { Plugin, Action, Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

export const restoreMemoriesAction: Action = {
  name: "RESTORE_MEMORIES",
  similes: ["LOAD_MEMORIES", "RELOAD_MEMORIES"],
  description: "Restores persisted memories from disk into runtime memory",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes("restore memories") || text.includes("load memories");
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State | undefined): Promise<{ success: boolean; text: string }> => {
    const memPath = process.env.CLAUDE_MEM_PATH ?? "./data/claude-mem.json";
    try {
      if (!existsSync(memPath)) {
        return { success: false, text: "No persisted memories found." };
      }
      const data = JSON.parse(readFileSync(memPath, "utf-8")) as Array<{ content: { text: string }; tableName: string }>;
      let count = 0;
      for (const entry of data) {
        await runtime.createMemory({
          content: { text: entry.content.text },
          entityId: message.entityId,
          roomId: message.roomId,
          agentId: runtime.agentId,
        }, entry.tableName, true);
        count++;
      }
      return { success: true, text: "Restored " + count + " memories." };
    } catch (error) {
      return { success: false, text: "Failed to restore memories: " + (error as Error).message };
    }
  },
  examples: [
    [
      { role: "user", content: { text: "Restore my memories" } },
      { role: "assistant", content: { text: "Restored 5 memories." } }
    ]
  ]
};

export const persistMemoriesEvaluator: Evaluator = {
  alwaysRun: true,
  name: "persist-memories",
  description: "Saves FACT memories to disk after each response",
  validate: async (): Promise<boolean> => {
    return true;
  },
  handler: async (runtime: IAgentRuntime, message: Memory): Promise<void> => {
    const memPath = process.env.CLAUDE_MEM_PATH ?? "./data/claude-mem.json";
    const logger = (runtime as any).logger;
    try {
      const memories = await runtime.getMemories({
        roomId: message.roomId,
        tableName: "facts",
        count: 20,
      });
      const toSave = memories.map(m => ({ content: { text: m.content.text }, tableName: "facts" }));
      try {
        writeFileSync(memPath, JSON.stringify(toSave, null, 2));
      } catch {}
    } catch (error) {
      if (logger?.warn) logger.warn("Memory persistence failed: " + (error as Error).message);
    }
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
    const memPath = process.env.CLAUDE_MEM_PATH ?? "./data/claude-mem.json";
    const logger = (runtime as any).logger;
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
          roomId: "default",
          entityId: "system",
        }, entry.tableName, true);
      }
    } catch (error) {
      if (logger?.warn) logger.warn("onyx-claude-mem: Failed to load persisted memories: " + (error as Error).message);
    }
  }
};