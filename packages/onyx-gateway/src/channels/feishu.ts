import type { Channel, IncomingMessage } from "./index.js";

interface FeishuConfig {
  appId: string;
  appSecret: string;
  tenantAccessToken?: string;
  tokenExpiresAt?: number;
}

export class FeishuChannel implements Channel {
  readonly name = "feishu";
  private config: FeishuConfig | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const appId = config.FEISHU_APP_ID;
    const appSecret = config.FEISHU_APP_SECRET;
    if (!appId || !appSecret) {
      throw new Error("FEISHU_APP_ID and FEISHU_APP_SECRET required");
    }
    this.config = { appId, appSecret };
    await this.refreshToken();
    this.refreshInterval = setInterval(() => this.refreshToken(), 7200000);
  }

  private async refreshToken(): Promise<void> {
    if (!this.config) return;
    const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      }),
    });
    const data = await response.json() as { tenant_access_token?: string; expire?: number };
    if (data.tenant_access_token) {
      this.config.tenantAccessToken = data.tenant_access_token;
      this.config.tokenExpiresAt = Date.now() + (data.expire ?? 7200) * 1000;
    }
  }

  private async getToken(): Promise<string> {
    if (!this.config?.tenantAccessToken || !this.config.tokenExpiresAt || Date.now() >= this.config.tokenExpiresAt - 60000) {
      await this.refreshToken();
    }
    if (!this.config?.tenantAccessToken) throw new Error("Failed to get Feishu token");
    return this.config.tenantAccessToken;
  }

  async send(msg: { content: string; conversationId: string }, to: string): Promise<void> {
    const token = await this.getToken();
    const response = await fetch("https://open.feishu.cn/open-apis/im/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receive_id_type: "chat_id",
        receive_id: to,
        msg_type: "text",
        content: JSON.stringify({ text: msg.content }),
      }),
    });
    if (!response.ok) {
      throw new Error(`Feishu API error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}