import { Bot } from "grammy";
import type { Channel, IncomingMessage } from "./index.js";

export class TelegramChannel implements Channel {
  readonly name = "telegram";
  private bot: Bot | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const token = config.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN required");
    this.bot = new Bot(token);
    this.bot.on("message:text", async (ctx) => {
      if (!this.handler) return;
      await this.handler(
        { content: ctx.message.text, raw: ctx.message },
        String(ctx.message.from.id),
      );
    });
    void this.bot.start();
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.bot) throw new Error("TelegramChannel not initialized");
    await this.bot.api.sendMessage(to, msg.content);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}