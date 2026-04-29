import type { Channel, IncomingMessage } from "./index.js";

export class WeComChannel implements Channel {
  readonly name = "wecom";
  private corpId: string | null = null;
  private corpSecret: string | null = null;
  private agentId: string | null = null;
  private token: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.corpId = config.WECOM_CORP_ID;
    this.corpSecret = config.WECOM_CORP_SECRET;
    this.agentId = config.WECOM_AGENT_ID;
    if (!this.corpId || !this.corpSecret || !this.agentId) throw new Error("WECOM_CORP_ID, WECOM_CORP_SECRET, WECOM_AGENT_ID required");
    await this.refreshToken();
  }

  private async refreshToken(): Promise<void> {
    const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.corpId}&corpsecret=${this.corpSecret}`);
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (data.access_token) this.token = data.access_token;
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.token) throw new Error("WeComChannel not initialized");
    const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${this.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touser: to, msgtype: "text", agentid: this.agentId, text: { content: msg.content } }),
    });
    if (!res.ok) throw new Error(`WeCom API error: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}