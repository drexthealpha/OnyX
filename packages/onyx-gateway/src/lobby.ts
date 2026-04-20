import type { Channel } from "./channels/index.js";

export type QueuedMessage = {
  channelName: string;
  to: string;
  content: string;
  conversationId: string;
};

export class Lobby {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private channels: Map<string, Channel>;

  constructor(channels: Map<string, Channel>) {
    this.channels = channels;
  }

  enqueue(msg: QueuedMessage): void {
    this.queue.push(msg);
    this.dispatch();
  }

  private async dispatch(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const msg = this.queue.shift();
      if (!msg) continue;

      const channel = this.channels.get(msg.channelName);
      if (channel) {
        try {
          await channel.send(
            { content: msg.content, conversationId: msg.conversationId },
            msg.to,
          );
        } catch (err) {
          console.error(`Failed to dispatch message to ${msg.channelName}:`, err);
        }
      }
    }

    this.processing = false;
  }
}