export interface Channel {
  name: string;
  init(config: Record<string, string>): Promise<void>;
  send(msg: { content: string; conversationId: string }, to: string): Promise<void>;
  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void;
}

export type IncomingMessage = {
  content: string;
  conversationId?: string;
  raw?: unknown;
};

export { TelegramChannel } from "./telegram.js";
export { DiscordChannel } from "./discord.js";
export { SlackChannel } from "./slack.js";
export { WhatsAppChannel } from "./whatsapp.js";
export { WebChatChannel } from "./webchat.js";
export { MatrixChannel } from "./matrix.js";
export { FeishuChannel } from "./feishu.js";
export { WeComChannel } from "./wecom.js";
export { DingTalkChannel } from "./dingtalk.js";
export { HomeAssistantChannel } from "./homeassistant.js";
export { MattermostChannel } from "./mattermost.js";
export { SMSChannel } from "./sms.js";
export { SignalChannel } from "./signal.js";
export { QQBotChannel } from "./qqbot.js";
export { BlueBubblesChannel } from "./bluebubbles.js";
export { EmailChannel } from "./email.js";
export { WebhookChannel } from "./webhook.js";