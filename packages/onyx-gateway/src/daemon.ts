import { GATEWAY_PORT } from "../../../kernel/constants.ts";

import { Hono } from "hono";
import { pino } from "pino";
import { Lobby } from "./lobby.js";
import { emit } from "./telemetry.js";
import { TelegramChannel } from "./channels/telegram.js";
import { DiscordChannel } from "./channels/discord.js";
import { SlackChannel } from "./channels/slack.js";
import { WhatsAppChannel } from "./channels/whatsapp.js";
import { WebChatChannel } from "./channels/webchat.js";
import { MatrixChannel } from "./channels/matrix.js";
import { FeishuChannel } from "./channels/feishu.js";
import { WeComChannel } from "./channels/wecom.js";
import { DingTalkChannel } from "./channels/dingtalk.js";
import { HomeAssistantChannel } from "./channels/homeassistant.js";
import { MattermostChannel } from "./channels/mattermost.js";
import { SMSChannel } from "./channels/sms.js";
import { SignalChannel } from "./channels/signal.js";
import { QQBotChannel } from "./channels/qqbot.js";
import { BlueBubblesChannel } from "./channels/bluebubbles.js";
import { EmailChannel } from "./channels/email.js";
import { WebhookChannel } from "./channels/webhook.js";
import type { Channel, IncomingMessage } from "./channels/index.js";

type TokenUsageMap = Record<string, number>;

const logger = pino();
const app = new Hono();

const channels: Map<string, Channel> = new Map();
const tokenUsage: TokenUsageMap = {};
let messagesHandled = 0;
const startTime = Date.now();

function envConfig(): Record<string, string> {
  return {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? "",
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ?? "",
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ?? "",
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET ?? "",
    SLACK_PORT: process.env.SLACK_PORT ?? "",
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN ?? "",
    WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ?? "",
    MATRIX_HOMESERVER: process.env.MATRIX_HOMESERVER ?? "",
    MATRIX_ACCESS_TOKEN: process.env.MATRIX_ACCESS_TOKEN ?? "",
    MATRIX_USER_ID: process.env.MATRIX_USER_ID ?? "",
    FEISHU_APP_ID: process.env.FEISHU_APP_ID ?? "",
    FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET ?? "",
    WECOM_CORP_ID: process.env.WECOM_CORP_ID ?? "",
    WECOM_CORP_SECRET: process.env.WECOM_CORP_SECRET ?? "",
    WECOM_AGENT_ID: process.env.WECOM_AGENT_ID ?? "",
    DINGTALK_APP_KEY: process.env.DINGTALK_APP_KEY ?? "",
    DINGTALK_APP_SECRET: process.env.DINGTALK_APP_SECRET ?? "",
    HA_URL: process.env.HA_URL ?? "",
    HA_TOKEN: process.env.HA_TOKEN ?? "",
    MATTERMOST_URL: process.env.MATTERMOST_URL ?? "",
    MATTERMOST_TOKEN: process.env.MATTERMOST_TOKEN ?? "",
    TWILIO_SID: process.env.TWILIO_SID ?? "",
    TWILIO_TOKEN: process.env.TWILIO_TOKEN ?? "",
    TWILIO_FROM: process.env.TWILIO_FROM ?? "",
    SIGNAL_NUMBER: process.env.SIGNAL_NUMBER ?? "",
    ONEBOT_URL: process.env.ONEBOT_URL ?? "",
    ONEBOT_TOKEN: process.env.ONEBOT_TOKEN ?? "",
    BLUEBUBBLES_URL: process.env.BLUEBUBBLES_URL ?? "",
    BLUEBUBBLES_PASSWORD: process.env.BLUEBUBBLES_PASSWORD ?? "",
    EMAIL_USER: process.env.EMAIL_USER ?? "",
    EMAIL_PASS: process.env.EMAIL_PASS ?? "",
    EMAIL_HOST: process.env.EMAIL_HOST ?? "",
    EMAIL_PORT: process.env.EMAIL_PORT ?? "",
  };
}

async function initChannels(): Promise<void> {
  const configs = [
    { name: "telegram", ChannelClass: TelegramChannel },
    { name: "discord", ChannelClass: DiscordChannel },
    { name: "slack", ChannelClass: SlackChannel },
    { name: "whatsapp", ChannelClass: WhatsAppChannel },
    { name: "webchat", ChannelClass: WebChatChannel },
    { name: "matrix", ChannelClass: MatrixChannel },
    { name: "feishu", ChannelClass: FeishuChannel },
    { name: "wecom", ChannelClass: WeComChannel },
    { name: "dingtalk", ChannelClass: DingTalkChannel },
    { name: "homeassistant", ChannelClass: HomeAssistantChannel },
    { name: "mattermost", ChannelClass: MattermostChannel },
    { name: "sms", ChannelClass: SMSChannel },
    { name: "signal", ChannelClass: SignalChannel },
    { name: "qqbot", ChannelClass: QQBotChannel },
    { name: "bluebubbles", ChannelClass: BlueBubblesChannel },
    { name: "email", ChannelClass: EmailChannel },
    { name: "webhook", ChannelClass: WebhookChannel },
  ];

  const config = envConfig();

  for (const { name, ChannelClass } of configs) {
    try {
      const ch = new ChannelClass();
      await ch.init(config);
      channels.set(name, ch);
      tokenUsage[name] = 0;
      ch.onMessage(async (msg: IncomingMessage, from: string) => {
        const start = Date.now();
        const conversationId = msg.conversationId ?? crypto.randomUUID();
        logger.info({ channel: name, from, content: msg.content }, "Received message");
        emit({
          conversationId,
          message: msg,
          channelName: name,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - start,
        });
        messagesHandled++;
        tokenUsage[name] = (tokenUsage[name] ?? 0) + Math.ceil((msg.content?.length ?? 0) / 4);
      });
      logger.info({ channel: name }, "Channel initialized");
    } catch (err) {
      logger.info({ channel: name, error: err }, "Channel skipped (missing config)");
    }
  }
}

const lobby = new Lobby(channels);

app.get("/health", (c) => {
  const uptime = process.uptime();
  return c.json({ status: "ok", uptime });
});

app.get("/channels", (c) => {
  const activeChannels = Array.from(channels.keys());
  return c.json({ channels: activeChannels });
});

app.get("/metrics", (c) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  return c.json({
    tokenUsage,
    messagesHandled,
    uptimeSeconds,
  });
});

app.post("/message", async (c) => {
  const body = await c.req.json<{
    channelName?: string;
    to?: string;
    content?: string;
    conversationId?: string;
  }>();

  const { channelName, to, content, conversationId } = body;

  if (!channelName || !to || !content) {
    return c.json({ error: "channelName, to, content required" }, 400);
  }

  lobby.enqueue({
    channelName,
    to,
    content,
    conversationId: conversationId ?? crypto.randomUUID(),
  });

  return c.json({ queued: true }, 202);
});

export async function startDaemon(): Promise<void> {
  await initChannels();

  logger.info({ port: GATEWAY_PORT, channels: channels.size }, "Starting gateway daemon");

  Bun.serve({
    port: GATEWAY_PORT,
    fetch: app.fetch,
  });

  logger.info({ port: GATEWAY_PORT }, "Gateway daemon started");
}

if (import.meta.main) {
  startDaemon().catch((err) => {
    logger.error({ error: err }, "Failed to start daemon");
    process.exit(1);
  });
}