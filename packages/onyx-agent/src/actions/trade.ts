import { Action, ActionResult, IAgentRuntime, Memory, State } from "@elizaos/core";

export const tradeAction: Action = {
  name: "EXECUTE_TRADE",
  similes: ["TRADE", "SWAP", "BUY", "SELL", "SWAP_TOKEN"],
  description: "Executes a token trade via the ONYX trading module",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    const hasKeywords = text.includes("buy") || text.includes("sell") || text.includes("swap") || text.includes("trade");
    const tradingEnabled = runtime.getSetting?.("TRADING_ENABLED") === "true";
    return hasKeywords && tradingEnabled;
  },
  handler: async (runtime, message, state, options, callback): Promise<ActionResult | undefined> => {
    const text = message.content?.text || "";
    const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(sol|usdc|eth|btc)/i);
    const amount = amountMatch?.[1] || "1";
    const token = amountMatch?.[2] || "SOL";
    try {
      const response = await runtime.fetch?.("http://localhost:" + (process.env.TRADING_PORT ?? "5010") + "/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputToken: token.toUpperCase(),
          outputToken: token.toUpperCase() === "SOL" ? "USDC" : "SOL",
          amount: parseFloat(amount),
          agentId: runtime.agentId,
        }),
      });
      if (response?.ok) {
        await runtime.createMemory({
          content: { text: "Trade executed: " + amount + " " + token.toUpperCase() },
          entityId: message.entityId!,
          roomId: message.roomId!,
          agentId: runtime.agentId,
        }, "actions");
        if (callback) await callback({ text: "Trade executed: " + amount + " " + token.toUpperCase() + " swapped. Please confirm the transaction was successful." });
        return { text: "Trade executed: " + amount + " " + token.toUpperCase() + " swapped. Please confirm the transaction was successful.", success: true };
      } else {
        if (callback) await callback({ text: "Trade execution failed: non-OK response" });
        return { text: "Trade execution failed: non-OK response", success: false };
      }
    } catch (error) {
      if (callback) await callback({ text: "Trade execution failed: " + (error as Error).message });
      return { text: "Trade execution failed: " + (error as Error).message, success: false };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Swap 1 SOL for USDC" } },
      { name: "assistant", content: { text: "Trade executed: 1 SOL USDC swapped. Please confirm the transaction was successful." } }
    ],
    [
      { name: "user", content: { text: "Buy 0.5 SOL" } },
      { name: "assistant", content: { text: "Trade executed: 0.5 SOL bought. Please confirm the transaction was successful." } }
    ]
  ]
} as Action;