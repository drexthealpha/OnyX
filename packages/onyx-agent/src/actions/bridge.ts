import { Action, ActionResult, IAgentRuntime, Memory, State } from "@elizaos/core";

export const bridgeAction: Action = {
  name: "BRIDGE_ASSET",
  similes: ["BRIDGE", "CROSS_CHAIN", "IKA_BRIDGE", "TRANSFER_CROSS_CHAIN"],
  description: "Bridges an asset across chains using Ika dWallet bridge protocol",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    const hasBridgeKeyword = text.includes("bridge") || text.includes("cross-chain") || text.includes("ika");
    const ikaEnabled = runtime.getSetting?.("IKA_ENABLED") === "true";
    return hasBridgeKeyword && ikaEnabled;
  },
  handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(sol|eth|btc)/i);
    const amount = amountMatch?.[1] || "1";
    const token = amountMatch?.[2] || "SOL";
    let sourceChain = "Solana";
    let destChain = "Ethereum";
    if (text.includes("solana") && text.includes("ethereum")) {
      sourceChain = "Solana";
      destChain = "Ethereum";
    } else if (text.includes("ethereum") && text.includes("solana")) {
      sourceChain = "Ethereum";
      destChain = "Solana";
    }
    try {
      const response = await runtime.fetch?.("http://localhost:" + (process.env.IKA_PORT ?? "5030") + "/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceChain,
          destChain,
          token: token.toUpperCase(),
          amount: parseFloat(amount),
          agentId: runtime.agentId,
        }),
      });
      if (response?.ok) {
        await runtime.createMemory({
          content: { text: "Bridge executed: " + amount + " " + token.toUpperCase() + " from " + sourceChain + " to " + destChain },
          entityId: message.entityId!,
          roomId: message.roomId!,
          agentId: runtime.agentId,
        }, "actions");
        if (callback) await callback({ text: "Bridge initiated: " + amount + " " + token.toUpperCase() + " from " + sourceChain + " to " + destChain + " via Ika." });
        return { text: "Bridge initiated: " + amount + " " + token.toUpperCase() + " from " + sourceChain + " to " + destChain + " via Ika.", success: true };
      } else {
        if (callback) await callback({ text: "Bridge failed: non-OK response" });
        return { text: "Bridge failed: non-OK response", success: false };
      }
    } catch (error) {
      if (callback) await callback({ text: "Bridge failed: " + (error as Error).message });
      return { text: "Bridge failed: " + (error as Error).message, success: false };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Bridge 1 SOL to Ethereum" } },
      { name: "assistant", content: { text: "Bridge initiated: 1 SOL from Solana to Ethereum via Ika." } }
    ],
    [
      { name: "user", content: { text: "Cross-chain bridge my SOL to ETH" } },
      { name: "assistant", content: { text: "Bridge initiated via Ika." } }
    ]
  ]
} as Action;