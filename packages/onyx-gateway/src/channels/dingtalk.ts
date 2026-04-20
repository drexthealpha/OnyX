import type { Channel, IncomingMessage } from "./index.js";

interface DingTalkConfig {
  appKey: string;
  appSecret: string;
  accessToken?: string;
  tokenExpiresAt?: number;
}

export class DingTalkChannel implements Channel {
  readonly name = "dingtalk";
  private config: DingTalkConfig | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const appKey = config.DINGTALK_APP_KEY;
    const appSecret = config.DINGTALK_APP_SECRET;
    if (!appKey || !appSecret) {
      throw new Error("DINGTALK_APP_KEY and DINGTALK_APP_SECRET required");
    }
    this.config = { appKey, appSecret };
    await this.refreshToken();
  }

  private async refreshToken(): Promise<void> {
    if (!this.config) return;
    const response = await fetch("https://api.dingtalk.com/v1.0/oauth2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appKey: this.config.appKey,
        appSecret: this.config.appSecret,
      }),
    });
    const data = await response.json() as { accessToken?: string; expireIn?: number };
    if (data.accessToken) {
      this.config.accessToken = data.accessToken;
      this.config.tokenExpiresAt = Date.now() + ((data.expireIn ?? 7200) - 300) * 1000;
    }
  }

  private async getToken(): Promise<string> {
    if (!this.config?.accessToken || !this.config.tokenExpiresAt || Date.now() >= this.config.tokenExpiresAt) {
      await this.refreshToken();
    }
    if (!this.config?.accessToken) throw new Error("Failed to get DingTalk access token");
    return this.config.accessToken;
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    const token = await this.getToken();
    const response = await fetch("https://api.dingtalk.com/v1.0/robot/otoMessages", {
      method: "POST",
      headers: {
        "x-acs-dingtalk-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        openConversationId: to,
        msg: { msgType: "text", content: { text: msg.content } },
      }),
    });
    if (!response.ok) {
      throw new Error(`DingTalk API error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}