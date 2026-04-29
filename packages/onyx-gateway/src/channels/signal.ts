import type { Channel, IncomingMessage } from "./index.js";

export class SignalChannel implements Channel {
  readonly name = "signal";
  private number: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.number = config.SIGNAL_NUMBER;
    if (!this.number) throw new Error("SIGNAL_NUMBER required");
    const res = await fetch(`http://localhost:8080/v1/receive/${this.number}`);
    if (!res.ok) throw new Error("Signal CLI not reachable at localhost:8080");
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.number) throw new Error("SignalChannel not initialized");
    const res = await fetch("http://localhost:8080/v2/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: [to], message: msg.content }),
    });
    if (!res.ok) throw new Error(`Signal CLI error: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}