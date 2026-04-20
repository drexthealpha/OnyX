import type { Channel, IncomingMessage } from "./index.js";

interface WeComConfig {
  corpId: string;
  corpSecret: string;
  agentId: string;
  accessToken?: string;
  tokenExpiresAt?: number;
}

export class WeComChannel implements Channel {
  readonly name = "wecom";
  private config: WeComConfig | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const corpId = config.WECOM_CORP_ID;
    const corpSecret = config.WECOM_CORP_SECRET;
    const agentId = config.WECOM_AGENT_ID;
    if (!corpId || !corpSecret || !agentId) {
      throw new Error("WECOM_CORP_ID, WECOM_CORP_SECRET, WECOM_AGENT_ID required");
    }
    this.config = { corpId, corpSecret, agentId };
    await this.refreshToken();
  }

  private async refreshToken(): Promise<void> {
    if (!this.config) return;
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.config.corpId}&corpsecret=${this.config.corpSecret}`,
    );
    const data = await response.json() as { access_token?: string; expires_in?: number };
    if (data.access_token) {
      this.config.accessToken = data.access_token;
      this.config.tokenExpiresAt = Date.now() + ((data.expires_in ?? 7200) - 300) * 1000;
    }
  }

  private async getToken(): Promise<string> {
    if (!this.config?.accessToken || !this.config.tokenExpiresAt || Date.now() >= this.config.tokenExpiresAt) {
      await this.refreshToken();
    }
    if (!this.config?.accessToken) throw new Error("Failed to get WeCom access token");
    return this.config.accessToken;
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    const token = await this.getToken();
    const response = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        touser: to,
        msgtype: "text",
        agentid: this.config?.agentId,
        text: { content: msg.content },
      }),
    });
    if (!response.ok) {
      throw new Error(`WeCom API error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}