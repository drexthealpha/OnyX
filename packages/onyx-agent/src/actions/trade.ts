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
    const amountStr = amountMatch?.[1] || "1";
    const tokenSymbol = amountMatch?.[2] || "SOL";
    
    try {
      // 1. Dynamic import of trading module (library mode)
      const { execute, resolveToken, getPortfolio, runAnalysis } = await import("@onyx/trading");
      
      // 2. Resolve token info
      const tokenInfo = await resolveToken(tokenSymbol);
      
      // 3. Run analysis to get a decision
      const decision = await runAnalysis(tokenInfo.mint);
      
      // 4. Get current portfolio
      const portfolio = getPortfolio();

      // 5. Execute trade directly
      const result = await execute(tokenInfo.mint, decision, portfolio, {
        dryRun: false, // REAL TRADE
        usePrivacy: true
      });

      if (result.success) {
        const responseText = `Trade executed successfully!
Signature: ${result.txHash}
Action: ${decision.action} ${decision.size * 100}% of portfolio
Reasoning: ${decision.reasoning.split('\n')[0]}`;

        await runtime.createMemory({
          content: { text: responseText },
          entityId: message.entityId!,
          roomId: message.roomId!,
          agentId: runtime.agentId,
        }, "actions");

        if (callback) await callback({ text: responseText });
        return { text: responseText, success: true };
      } else {
        const errorText = `Trade execution failed: ${result.error || 'Unknown error'}`;
        if (callback) await callback({ text: errorText });
        return { text: errorText, success: false };
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