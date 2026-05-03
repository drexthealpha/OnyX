import { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

export const shieldAction: Action = {
  name: "SHIELD_ASSET",
  similes: ["HIDE_ASSET", "PRIVACY_SHIELD", "UMBRA_SHIELD", "ANONYMIZE"],
  description: "Shields an asset using Umbra stealth address protocol for privacy-preserving transfers",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    const hasPrivacyKeyword = text.includes("shield") || text.includes("private") || text.includes("umbra");
    const gatewayUrl = runtime.getSetting?.("GATEWAY_URL") ?? process.env['GATEWAY_URL'] ?? "http://localhost:4000";
    const umbraEnabled = runtime.getSetting?.("UMBRA_ENABLED") === "true";
    return hasPrivacyKeyword && umbraEnabled;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options: any = {}, callback?: HandlerCallback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(sol|usdc|eth|btc)/i);
    const amount = amountMatch?.[1] || "1";
    const token = amountMatch?.[2] || "SOL";
    try {
      const response = await runtime.fetch?.("http://localhost:" + (process.env['UMBRA_PORT'] ?? "5020") + "/shield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.toUpperCase(),
          amount: parseFloat(amount),
          agentId: runtime.agentId,
        }),
      });
      if (response?.ok) {
        await runtime.createMemory({
          content: { text: "Shielded: " + amount + " " + token.toUpperCase() + " via Umbra" },
          entityId: message.entityId!,
          roomId: message.roomId!,
          agentId: runtime.agentId,
        }, "actions");
        if (callback) await callback({ text: "Asset shielded: " + amount + " " + token.toUpperCase() + " via Umbra stealth protocol." });
        return { text: "Asset shielded: " + amount + " " + token.toUpperCase() + " via Umbra stealth protocol.", success: true };
      } else {
        if (callback) await callback({ text: "Shield failed: non-OK response" });
        return { text: "Shield failed: non-OK response", success: false };
      }
    } catch (error) {
      if (callback) await callback({ text: "Shield failed: " + (error as Error).message });
      return { text: "Shield failed: " + (error as Error).message, success: false };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Shield my 1 SOL" } },
      { name: "assistant", content: { text: "Asset shielded: 1 SOL via Umbra stealth protocol." } }
    ],
    [
      { name: "user", content: { text: "Make my transaction private with Umbra" } },
      { name: "assistant", content: { text: "Asset shielded via Umbra stealth protocol." } }
    ]
  ]
} as Action;