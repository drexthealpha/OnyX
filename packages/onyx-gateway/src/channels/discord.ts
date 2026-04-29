import { Client, GatewayIntentBits, Events } from "discord.js";
import type { Channel, IncomingMessage } from "./index.js";

export class DiscordChannel implements Channel {
  readonly name = "discord";
  private client: Client | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const token = config.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_BOT_TOKEN required");
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    });
    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot || !this.handler) return;
      await this.handler({ content: message.content, raw: message }, message.author.id);
    });
    await this.client.login(token);
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.client) throw new Error("DiscordChannel not initialized");
    const channel = await this.client.channels.fetch(to);
    if (!channel?.isTextBased()) throw new Error(`Channel ${to} is not text-based`);
    await channel.send(msg.content);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}