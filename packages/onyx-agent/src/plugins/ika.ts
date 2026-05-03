import { Plugin, IAgentRuntime, Action, Memory, State, HandlerCallback, ActionResult } from "@elizaos/core";

export const getDWalletInfoAction: Action = {
  name: "GET_DWALLET_INFO",
  description: "Get decentralized wallet info from Ika bridge for cross-chain signing.",
  simulated: false,
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return !!(process.env.IKA_ENABLED === "true" && process.env.ONYX_WALLET_PATH);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    const pubkeyMatch = text.match(/wallet\s+([a-zA-Z0-9]{32,44})/i);
    
    if (!pubkeyMatch) {
      const err = "Could not parse wallet address from message.";
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }

    try {
      const { getDWalletInfoTool } = await import("@onyx/solana/tools/ika");
      const result = await getDWalletInfoTool.execute({
        curve: 0, // Secp256k1
        userPubkey: pubkeyMatch[1]
      });

      const responseText = `Ika dWallet Info:
PDA: ${result.pda}
Curve: Secp256k1 (0)
User: ${result.userPubkey}`;

      if (callback) await callback({ text: responseText });
      return { text: responseText, success: true };
    } catch (error: any) {
      const err = `Ika info retrieval failed: ${error.message}`;
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Get my Ika dWallet info for address 5H9...xyz" } },
      { user: "{{user2}}", content: { text: "Retrieving Ika dWallet info for 5H9...xyz...", action: "GET_DWALLET_INFO" } }
    ]
  ]
};

import { ikaSignAction } from "../actions/ika.js";

export const ikaPlugin: Plugin = {
  name: "onyx-ika",
  description: "Ika dWallet bridge for cross-chain asset transfers via MPC signing",
  actions: [getDWalletInfoAction, ikaSignAction],
  providers: [],
  evaluators: [],
  init: async (config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const enabled = config.IKA_ENABLED ?? process.env.IKA_ENABLED;
    const logger = runtime.logger;
    if (enabled !== "true") {
      if (logger?.info) logger.info("onyx-ika: disabled. Set IKA_ENABLED=true to activate.");
      return;
    }
    if (logger?.info) logger.info("onyx-ika: dWallet bridge active.");
  }
};