import { Plugin, Provider, IAgentRuntime } from "@elizaos/core";

export interface NosanaJobDefinition {
  ops: Array<{
    id: string;
    args: {
      image: string;
      expose: number;
      env: Record<string, string>;
    };
    execution: { group: string };
    type: string;
  }>;
  version: string;
}

export const nosanaStatusProvider: Provider = {
  name: "nosana-status",
  position: 20,
  description: "Provides Nosana RPC connection status",
  get: async (runtime: IAgentRuntime): Promise<{ text: string; values: Record<string, unknown> }> => {
    const rpcUrl = runtime.getSetting?.("NOSANA_RPC_URL") ?? process.env.NOSANA_RPC_URL;
    if (!rpcUrl) {
      return { text: "Nosana RPC: not configured", values: { online: false } };
    }
    try {
      const response = await runtime.fetch?.(rpcUrl + "/health");
      if (response?.ok) {
        return { text: "Nosana RPC: online", values: { online: true } };
      }
    } catch {}
    return { text: "Nosana RPC: offline", values: { online: false } };
  }
};

export function buildNosanaJobDef(imageTag: string, envVars: Record<string, string>): NosanaJobDefinition {
  return {
    ops: [
      {
        id: "agent",
        args: {
          image: imageTag,
          expose: 3000,
          env: envVars,
        },
        execution: { group: "run" },
        type: "container/run",
      },
    ],
    version: "0.1",
  };
}

export const nosanaPlugin: Plugin = {
  name: "onyx-nosana",
  description: "Submits and manages Nosana GPU compute jobs for ONYX agents",
  actions: [],
  providers: [nosanaStatusProvider],
  evaluators: [],
  services: [],
  init: async (config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const rpcUrl = config.NOSANA_RPC_URL ?? process.env.NOSANA_RPC_URL;
    const privateKey = config.NOSANA_PRIVATE_KEY ?? process.env.NOSANA_PRIVATE_KEY;
    const logger = (runtime as any).logger;
    if (!rpcUrl || !privateKey) {
      if (logger?.warn) logger.warn("onyx-nosana: NOSANA_RPC_URL or NOSANA_PRIVATE_KEY not set. Nosana jobs disabled.");
      return;
    }
    if (logger?.info) logger.info("onyx-nosana: Nosana plugin initialized. RPC: " + rpcUrl);
  }
};