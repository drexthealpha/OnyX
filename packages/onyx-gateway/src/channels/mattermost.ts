import type { Channel, IncomingMessage } from "./index.js";

export class MattermostChannel implements Channel {
  readonly name = "mattermost";
  private url: string | null = null;
  private token: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;
  private ws: import("ws").WebSocket | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const url = config.MATTERMOST_URL;
    const token = config.MATTERMOST_TOKEN;
    if (!url || !token) {
      throw new Error("MATTERMOST_URL and MATTERMOST_TOKEN required");
    }
    this.url = url;
    this.token = token;

    const wsUrl = url.replace("http", "ws") + "/api/v4/websocket";
    this.ws = new (await import("ws")).WebSocket(wsUrl);

    this.ws.on("message", async (data) => {
      if (!this.handler) return;
      const event = JSON.parse(data.toString());
      if (event.event === "posted" && event.data?.post) {
        const post = JSON.parse(event.data.post);
        await this.handler({ content: post.message, raw: post }, post.user_id);
      }
    });
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.url || !this.token) throw new Error("MattermostChannel not initialized");
    const response = await fetch(`${this.url}/api/v4/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel_id: to,
        message: msg.content,
      }),
    });
    if (!response.ok) {
      throw new Error(`Mattermost API error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}