import { Plugin, Provider, IAgentRuntime, Memory, State, ProviderResult, Action, HandlerCallback, ActionResult } from "@elizaos/core";

export interface NosanaJobDefinition {
  image: string;
  env?: Record<string, string>;
  expose?: number;
}

export const nosanaStatusProvider: Provider = {
  name: "nosana-status",
  position: 20,
  description: "Provides Nosana RPC connection status",
  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> => {
    const rpcUrl = runtime.getSetting?.("NOSANA_RPC_URL") ?? process.env['NOSANA_RPC_URL'];
    if (!rpcUrl) {
      return { text: "Nosana RPC: not configured", values: { online: false as string | boolean } };
    }
    try {
      const response = await runtime.fetch?.(rpcUrl + "/health");
      if (response?.ok) {
        return { text: "Nosana RPC: online", values: { online: true as string | boolean } };
      }
    } catch {}
    return { text: "Nosana RPC: offline", values: { online: false as string | boolean } };
  }
};

export function buildNosanaJobDef(image: string, env: Record<string, string> = {}): NosanaJobDefinition {
  return {
    image,
    env: {
      ONYX_TASK: "compute",
      ...env
    },
    expose: 3000
  };
}

export const submitJobAction: Action = {
  name: "SUBMIT_GPU_JOB",
  description: "Submit a GPU compute job to the Nosana network for training or inference.",
  simulated: false,
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return !!(process.env['NOSANA_PRIVATE_KEY'] && process.env['NOSANA_RPC_URL']);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options: any = {}, callback?: HandlerCallback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    const imageMatch = text.match(/image\s+([a-zA-Z0-9.\-_/:]+)/i);
    const image = imageMatch?.[1] || "nosana/ai-training:latest";

    try {
      const { getNosanaClient, JobBuilder } = await import("@onyx/compute");
      const client = await getNosanaClient();
      
      const builder = new JobBuilder();
      const jobDef = builder
        .setImage(image)
        .setEnv({
          ONYX_AGENT_ID: runtime.agentId,
          ONYX_TASK: "compute-on-demand"
        })
        .setExpose(3000)
        .buildObject();

      // nosana-kit API: client.jobs.post(jobDef)
      const result = await (client as any).jobs.post(jobDef);

      const responseText = `Nosana GPU job submitted successfully!
Job ID: ${result.job}
Market: ${result.market}
Image: ${image}`;

      if (callback) await callback({ text: responseText });
      return { text: responseText, success: true };
    } catch (error: any) {
      const err = `Nosana job submission failed: ${error.message}`;
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }
  },
  examples: [
    [
      { name: "{{user1}}", content: { text: "Deploy a GPU job with image pytorch/pytorch for training" } },
      { name: "{{user2}}", content: { text: "Submitting GPU job to Nosana network...", action: "SUBMIT_GPU_JOB" } }
    ]
  ]
};

export const nosanaPlugin: Plugin = {
  name: "onyx-nosana",
  description: "Submits and manages Nosana GPU compute jobs for ONYX agents",
  actions: [submitJobAction],
  providers: [nosanaStatusProvider],
  evaluators: [],
  services: [],
  init: async (config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const rpcUrl = config['NOSANA_RPC_URL'] ?? process.env['NOSANA_RPC_URL'];
    const privateKey = config['NOSANA_PRIVATE_KEY'] ?? process.env['NOSANA_PRIVATE_KEY'];
    const logger = runtime.logger;
    if (!rpcUrl || !privateKey) {
      if (logger?.warn) logger.warn("onyx-nosana: NOSANA_RPC_URL or NOSANA_PRIVATE_KEY not set. Nosana jobs disabled.");
      return;
    }
    if (logger?.info) logger.info("onyx-nosana: Nosana plugin initialized. RPC: " + rpcUrl);
  }
};