import { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

export const browseAction: Action = {
  name: "BROWSE_WEB",
  similes: ["OPEN_URL", "NAVIGATE", "VISIT", "FETCH_PAGE", "GO_TO"],
  description: "Opens a URL using the ONYX browser module and returns page content",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return text.includes("http://") || text.includes("https://") || text.includes("browse") || text.includes("open") || text.includes("navigate to");
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options: unknown = {}, callback?: HandlerCallback): Promise<ActionResult> => {
    const urlMatch = (message.content?.text || "").match(/https?:\/\/[^\s]+/);
    const url = urlMatch?.[0];
    if (!url) {
      if (callback) await callback({ text: "No valid URL found in message." });
      return { text: "No valid URL found in message.", success: false };
    }
    try {
      const response = await runtime.fetch?.("http://localhost:" + (process.env['BROWSER_PORT'] ?? "5070") + "/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          agentId: runtime.agentId,
        }),
      });
      if (response?.ok) {
        const data = await response.json() as { content?: string };
        const summary = data.content || "Page loaded successfully.";
        await runtime.createMemory({
          content: { text: "Browsed: " + url },
          entityId: message.entityId!,
          roomId: message.roomId!,
          agentId: runtime.agentId,
        }, "documents");
        if (callback) await callback({ text: summary });
        return { text: summary, success: true };
      } else {
        if (callback) await callback({ text: "Failed to fetch page: non-OK response" });
        return { text: "Failed to fetch page: non-OK response", success: false };
      }
    } catch (error) {
      if (callback) await callback({ text: "Failed to fetch page: " + (error as Error).message });
      return { text: "Failed to fetch page: " + (error as Error).message, success: false };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Browse https://nosana.io" } },
      { name: "assistant", content: { text: "Nosana is a decentralized GPU network for rendering and AI inference. Users can participate as nodes or rent GPU time." } }
    ],
    [
      { name: "user", content: { text: "Open https://jup.ag" } },
      { name: "assistant", content: { text: "Jupiter DEX aggregator interface loaded. You can swap tokens directly here." } }
    ]
  ]
} as Action;