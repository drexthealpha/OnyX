import { Plugin, IAgentRuntime } from "@elizaos/core";

export const ikaPlugin: Plugin = {
  name: "onyx-ika",
  description: "Ika dWallet bridge for cross-chain asset transfers via MPC signing",
  actions: [],
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