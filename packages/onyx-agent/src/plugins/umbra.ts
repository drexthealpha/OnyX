import { Plugin, IAgentRuntime, Action, Memory, State, HandlerCallback, ActionResult } from "@elizaos/core";

export const sendStealthAction: Action = {
  name: "SEND_STEALTH",
  description: "Send tokens to a stealth address using the Umbra protocol for privacy.",
  simulated: false,
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return !!(process.env.UMBRA_ENABLED === "true" && process.env.ONYX_WALLET_PATH);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(sol|usdc|eth|btc)/i);
    const destMatch = text.match(/to\s+([a-zA-Z0-9]{32,44})/i);
    
    if (!amountMatch || !destMatch) {
      const err = "Could not parse amount or destination address from message.";
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }

    try {
      const { shieldAssetTool } = await import("@onyx/solana/tools/umbra");
      const result = await shieldAssetTool.execute({
        token: amountMatch[2].toUpperCase() === "SOL" ? "So11111111111111111111111111111111111111112" : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // Default SOL or USDC
        amount: parseFloat(amountMatch[1]) * 1e9, // Simplistic conversion to lamports
        destination: destMatch[1]
      });

      const responseText = `Stealth transfer initiated via Umbra protocol.
Signature: ${result.queueSignature}
Privacy Status: Shielded`;

      if (callback) await callback({ text: responseText });
      return { text: responseText, success: true };
    } catch (error: any) {
      const err = `Umbra transfer failed: ${error.message}`;
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Send 1.5 SOL to stealth address 5H9...xyz for privacy" } },
      { user: "{{user2}}", content: { text: "Initiating stealth transfer of 1.5 SOL via Umbra...", action: "SEND_STEALTH" } }
    ]
  ]
};

export const umbraPlugin: Plugin = {
  name: "onyx-umbra",
  description: "Umbra stealth address protocol for privacy-preserving asset transfers",
  actions: [sendStealthAction],
  providers: [],
  evaluators: [],
  init: async (config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const enabled = config.UMBRA_ENABLED ?? process.env.UMBRA_ENABLED;
    const logger = runtime.logger;
    if (enabled !== "true") {
      if (logger?.info) logger.info("onyx-umbra: disabled. Set UMBRA_ENABLED=true to activate.");
      return;
    }
    if (logger?.info) logger.info("onyx-umbra: privacy layer active.");
  }
};