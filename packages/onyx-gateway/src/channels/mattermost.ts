import type { Channel, IncomingMessage } from "./index.js";

export class MattermostChannel implements Channel {
  readonly name = "mattermost";
  private url: string | null = null;
  private token: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.url = config.MATTERMOST_URL;
    this.token = config.MATTERMOST_TOKEN;
    if (!this.url || !this.token) throw new Error("MATTERMOST_URL and MATTERMOST_TOKEN required");
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.url || !this.token) throw new Error("MattermostChannel not initialized");
    const res = await fetch(`${this.url}/api/v4/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel_id: to, message: msg.content }),
    });
    if (!res.ok) throw new Error(`Mattermost API error: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}