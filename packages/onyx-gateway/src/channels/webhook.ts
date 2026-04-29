import type { Channel, IncomingMessage } from "./index.js";

export class WebhookChannel implements Channel {
  readonly name = "webhook";
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(_config: Record<string, string>): Promise<void> {}

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!to.startsWith("http://") && !to.startsWith("https://")) throw new Error("WebhookChannel send requires a URL as 'to' parameter");
    const res = await fetch(to, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msg.content }) });
    if (!res.ok) throw new Error(`Webhook failed: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}