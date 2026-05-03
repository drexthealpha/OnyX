import { App, LogLevel } from "@slack/bolt";
import type { Channel, IncomingMessage } from "./index.js";

export class SlackChannel implements Channel {
  readonly name = "slack";
  private app: App | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const token = config.SLACK_BOT_TOKEN;
    const secret = config.SLACK_SIGNING_SECRET;
    if (!token || !secret) throw new Error("SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET required");

    this.app = new App({ token, signingSecret: secret, logLevel: LogLevel.ERROR });
    this.app.message(async ({ message, say }) => {
      const msg = message as any;
      if (!this.handler || msg.subtype === "bot_message" || msg.subtype === "app_message") return;
      await this.handler({ content: msg.text, raw: msg }, msg.user);
    });
    const port = parseInt(config.SLACK_PORT || "3001", 10);
    await this.app.start(port);
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.app) throw new Error("SlackChannel not initialized");
    await this.app.client.chat.postMessage({ channel: to, text: msg.content });
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}