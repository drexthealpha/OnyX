import type { Channel, IncomingMessage } from "./index.js";

export class QQBotChannel implements Channel {
  readonly name = "qqbot";
  private url: string | null = null;
  private token: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;
  private ws: import("ws").WebSocket | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const url = config.ONEBOT_URL;
    const token = config.ONEBOT_TOKEN;
    if (!url) {
      throw new Error("ONEBOT_URL required");
    }
    this.url = url;
    this.token = token;
    const wsUrl = url.replace("http", "ws") + "/onebot/v11/ws";
    this.ws = new (await import("ws")).WebSocket(wsUrl);

    this.ws.on("message", async (data) => {
      if (!this.handler) return;
      const event = JSON.parse(data.toString());
      if (event.post_type === "message") {
        await this.handler({ content: event.message, raw: event }, String(event.user_id));
      }
    });
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.url) throw new Error("QQBotChannel not initialized");
    const response = await fetch(`${this.url}/onebot/v11/send_msg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({
        user_id: to,
        message: msg.content,
      }),
    });
    if (!response.ok) {
      throw new Error(`OneBot API error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}