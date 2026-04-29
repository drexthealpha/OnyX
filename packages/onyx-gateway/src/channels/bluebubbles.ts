import type { Channel, IncomingMessage } from "./index.js";

export class BlueBubblesChannel implements Channel {
  readonly name = "bluebubbles";
  private url: string | null = null;
  private password: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.url = config.BLUEBUBBLES_URL;
    this.password = config.BLUEBUBBLES_PASSWORD;
    if (!this.url || !this.password) throw new Error("BLUEBUBBLES_URL and BLUEBUBBLES_PASSWORD required");
    const res = await fetch(`${this.url}/api/v1/server`, { headers: { Authorization: `Bearer ${this.password}` } });
    if (!res.ok) throw new Error("BlueBubbles connection failed");
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.url || !this.password) throw new Error("BlueBubblesChannel not initialized");
    const res = await fetch(`${this.url}/api/v1/message/text`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.password}`, "Content-Type": "application/json" },
      body: JSON.stringify({ address: to, text: msg.content }),
    });
    if (!res.ok) throw new Error(`BlueBubbles API error: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}