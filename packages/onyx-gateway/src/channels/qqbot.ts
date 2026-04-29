import type { Channel, IncomingMessage } from "./index.js";

export class QQBotChannel implements Channel {
  readonly name = "qqbot";
  private url: string | null = null;
  private token: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.url = config.ONEBOT_URL;
    this.token = config.ONEBOT_TOKEN;
    if (!this.url) throw new Error("ONEBOT_URL required");
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.url) throw new Error("QQBotChannel not initialized");
    const res = await fetch(`${this.url}/onebot/v11/send_msg`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      body: JSON.stringify({ user_id: to, message: msg.content }),
    });
    if (!res.ok) throw new Error(`OneBot API error: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}