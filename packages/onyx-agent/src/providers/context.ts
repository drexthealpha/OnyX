import { Provider, ProviderResult, IAgentRuntime, Memory, State } from "@elizaos/core";

export const screenContextProvider: Provider = {
  name: "screen-context",
  position: 10,
  dynamic: true,
  description: "Provides current screen context from the ONYX HUD module",
  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> => {
    try {
      const response = await runtime.fetch?.("http://localhost:" + (process.env.HUD_PORT ?? "5080") + "/context");
      if (response?.ok) {
        const data = await response.json() as { summary?: string };
        return { text: "Screen context: " + (data.summary || "No context available"), values: data };
      }
    } catch {}
    return { text: "", values: { available: false } };
  }
};