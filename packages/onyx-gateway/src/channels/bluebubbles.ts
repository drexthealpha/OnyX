import type { Channel, IncomingMessage } from "./index.js";

export class BlueBubblesChannel implements Channel {
  readonly name = "bluebubbles";
  private url: string | null = null;
  private password: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;
  private ws: import("ws").WebSocket | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const url = config.BLUEBUBBLES_URL;
    const password = config.BLUEBUBBLES_PASSWORD;
    if (!url || !password) {
      throw new Error("BLUEBUBBLES_URL and BLUEBUBBLES_PASSWORD required");
    }
    this.url = url;
    this.password = password;

    const response = await fetch(`${this.url}/api/v1/server`, {
      headers: { Authorization: `Bearer ${this.password}` },
    });
    if (!response.ok) {
      throw new Error("BlueBubbles connection failed");
    }

    this.ws = new (await import("ws")).WebSocket(`${this.url.replace("http", "ws")}/api/v1/ws`, {
      headers: { Authorization: `Bearer ${this.password}` },
    });

    this.ws.on("message", async (data) => {
      if (!this.handler) return;
      const event = JSON.parse(data.toString());
      if (event.event === "new-message") {
        const msg = event.data;
        await this.handler({ content: msg.text, raw: msg }, msg.handle);
      }
    });
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.url || !this.password) throw new Error("BlueBubblesChannel not initialized");
    const response = await fetch(`${this.url}/api/v1/message/text`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.password}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: to,
        text: msg.content,
      }),
    });
    if (!response.ok) {
      throw new Error(`BlueBubbles API error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}