import type { Channel, IncomingMessage } from "./index.js";

export class HomeAssistantChannel implements Channel {
  readonly name = "homeassistant";
  private url: string | null = null;
  private token: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.url = config.HA_URL;
    this.token = config.HA_TOKEN;
    if (!this.url || !this.token) {
      throw new Error("HA_URL and HA_TOKEN required");
    }
    const response = await fetch(`${this.url}/api/`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) {
      throw new Error(`Home Assistant connection failed: ${response.statusText}`);
    }
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.url || !this.token) throw new Error("HomeAssistantChannel not initialized");
    const response = await fetch(`${this.url}/api/services/notify/notify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: msg.content,
        target: to,
      }),
    });
    if (!response.ok) {
      throw new Error(`Home Assistant API error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}