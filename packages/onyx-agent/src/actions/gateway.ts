import { Action, ActionResult, HandlerCallback, HandlerOptions, IAgentRuntime, Memory, State } from "@elizaos/core";

export const gatewayAction: Action = {
  name: "SEND_VIA_GATEWAY",
  similes: ["RELAY_MESSAGE", "FORWARD_MESSAGE", "GATEWAY_SEND"],
  description: "Sends a message through the ONYX gateway to another agent or service",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    return !!message.content.text && message.content.text.length > 0;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    const gatewayUrl = runtime.getSetting?.("GATEWAY_URL") ?? process.env.GATEWAY_URL ?? "http://localhost:4000";
    try {
      const response = await runtime.fetch?.(gatewayUrl + "/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.content.text,
          agentId: runtime.agentId,
          timestamp: Date.now(),
        }),
      });
      if (response?.ok) {
        return callback({ text: "Message relayed via gateway.", success: true });
      } else {
        return callback({ text: "Gateway relay failed: non-OK response", success: false });
      }
    } catch (error) {
      return callback({ text: "Gateway relay failed: " + (error as Error).message, success: false });
    }
  },
  examples: [
    [
      { role: "user", content: { text: "Relay this message to agent two" } },
      { role: "assistant", content: { text: "Message relayed via gateway." } }
    ],
    [
      { role: "user", content: { text: "Forward my greeting to the trading agent" } },
      { role: "assistant", content: { text: "Message relayed via gateway." } }
    ]
  ]
};