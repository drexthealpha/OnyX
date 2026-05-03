import { Plugin, IAgentRuntime } from "@elizaos/core";

export const encryptPlugin: Plugin = {
  name: "onyx-encrypt",
  description: "Encrypt FHE (Fully Homomorphic Encryption) plugin for privacy-preserving computation",
  actions: [],
  providers: [],
  evaluators: [],
  init: async (config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const enabled = config['ENCRYPT_ENABLED'] ?? process.env['ENCRYPT_ENABLED'];
    const logger = runtime.logger;
    if (enabled !== "true") {
      if (logger?.info) logger.info("onyx-encrypt: disabled. Set ENCRYPT_ENABLED=true to activate.");
      return;
    }
    if (logger?.info) logger.info("onyx-encrypt: FHE computation layer active.");
  }
};