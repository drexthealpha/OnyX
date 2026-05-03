import { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

export const gatewayAction: Action = {
  name: "SEND_VIA_GATEWAY",
  similes: ["RELAY_MESSAGE", "FORWARD_MESSAGE", "GATEWAY_SEND"],
  description: "Sends a message through the ONYX gateway to another agent or service",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    return !!message.content?.text && message.content.text!.length > 0;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options: any = {}, callback?: HandlerCallback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    const gatewayUrl = runtime.getSetting?.("GATEWAY_URL") ?? process.env['GATEWAY_URL'] ?? "http://localhost:4000";
    
    try {
      const response = await runtime.fetch?.(gatewayUrl + "/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.content?.text,
          agentId: runtime.agentId,
          timestamp: Date.now(),
        }),
      });
      if (response?.ok) {
        if (callback) await callback({ text: "Message relayed via gateway." });
        return { text: "Message relayed via gateway.", success: true };
      } else {
        if (callback) await callback({ text: "Gateway relay failed: non-OK response" });
        return { text: "Gateway relay failed: non-OK response", success: false };
      }
    } catch (error) {
      if (callback) await callback({ text: "Gateway relay failed: " + (error as Error).message });
      return { text: "Gateway relay failed: " + (error as Error).message, success: false };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "Relay this message to agent two" } },
      { name: "assistant", content: { text: "Message relayed via gateway." } }
    ],
    [
      { name: "user", content: { text: "Forward my greeting to the trading agent" } },
      { name: "assistant", content: { text: "Message relayed via gateway." } }
    ]
  ]
} as Action;