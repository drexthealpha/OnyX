const RL_PORT = 19001;

export type ConversationTelemetry = {
  conversationId: string;
  message: unknown;
  channelName: string;
  timestamp: string;
  latencyMs: number;
};

export async function emit(t: ConversationTelemetry): Promise<void> {
  try {
    await fetch(`http://localhost:${RL_PORT}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
  } catch {
    // Fire-and-forget; never let telemetry crash the gateway
  }
}