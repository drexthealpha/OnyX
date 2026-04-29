import type { Channel, IncomingMessage } from "./index.js";

export class DingTalkChannel implements Channel {
  readonly name = "dingtalk";
  private appKey: string | null = null;
  private appSecret: string | null = null;
  private token: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.appKey = config.DINGTALK_APP_KEY;
    this.appSecret = config.DINGTALK_APP_SECRET;
    if (!this.appKey || !this.appSecret) throw new Error("DINGTALK_APP_KEY and DINGTALK_APP_SECRET required");
    await this.refreshToken();
  }

  private async refreshToken(): Promise<void> {
    const res = await fetch("https://api.dingtalk.com/v1.0/oauth2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appKey: this.appKey, appSecret: this.appSecret }),
    });
    const data = await res.json() as { accessToken?: string; expireIn?: number };
    if (data.accessToken) this.token = data.accessToken;
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.token) throw new Error("DingTalkChannel not initialized");
    const res = await fetch("https://api.dingtalk.com/v1.0/robot/otoMessages", {
      method: "POST",
      headers: { "x-acs-dingtalk-access-token": this.token, "Content-Type": "application/json" },
      body: JSON.stringify({ openConversationId: to, msg: { msgType: "text", content: { text: msg.content } } }),
    });
    if (!res.ok) throw new Error(`DingTalk API error: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}