import type { Channel, IncomingMessage } from "./index.js";

export class FeishuChannel implements Channel {
  readonly name = "feishu";
  private appId: string | null = null;
  private appSecret: string | null = null;
  private token: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;
  private refreshInterval: any = null;

  async init(config: Record<string, string>): Promise<void> {
    this.appId = config.FEISHU_APP_ID;
    this.appSecret = config.FEISHU_APP_SECRET;
    if (!this.appId || !this.appSecret) throw new Error("FEISHU_APP_ID and FEISHU_APP_SECRET required");
    await this.refreshToken();
    this.refreshInterval = setInterval(() => this.refreshToken(), 7200000);
  }

  private async refreshToken(): Promise<void> {
    const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret }),
    });
    const data = await res.json() as { tenant_access_token?: string; expire?: number };
    if (data.tenant_access_token) this.token = data.tenant_access_token;
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.token) throw new Error("FeishuChannel not initialized");
    const res = await fetch("https://open.feishu.cn/open-apis/im/v1/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ receive_id_type: "chat_id", receive_id: to, msg_type: "text", content: JSON.stringify({ text: msg.content }) }),
    });
    if (!res.ok) throw new Error(`Feishu API error: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}