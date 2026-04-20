import type { Channel, IncomingMessage } from "./index.js";

export class SignalChannel implements Channel {
  readonly name = "signal";
  private number: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.number = config.SIGNAL_NUMBER;
    if (!this.number) {
      throw new Error("SIGNAL_NUMBER required");
    }
    const response = await fetch(`http://localhost:8080/v1/receive/${this.number}`);
    if (!response.ok) {
      throw new Error("Signal CLI not reachable at localhost:8080");
    }
    this.pollInterval = setInterval(() => this.poll(), 2000);
  }

  private async poll(): Promise<void> {
    if (!this.number || !this.handler) return;
    try {
      const response = await fetch(`http://localhost:8080/v1/receive/${this.number}`);
      if (!response.ok) return;
      const messages = await response.json() as Array<{ envelope: { sourceNumber: string; message: string } }>;
      for (const msg of messages) {
        const envelope = msg.envelope;
        await this.handler({ content: envelope.message }, envelope.sourceNumber);
      }
    } catch {
      // Ignore polling errors
    }
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.number) throw new Error("SignalChannel not initialized");
    const response = await fetch("http://localhost:8080/v2/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipients: [to],
        message: msg.content,
      }),
    });
    if (!response.ok) {
      throw new Error(`Signal CLI error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}