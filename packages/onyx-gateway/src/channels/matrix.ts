import { createClient, MatrixClient } from "matrix-js-sdk";
import type { Channel, IncomingMessage } from "./index.js";

export class MatrixChannel implements Channel {
  readonly name = "matrix";
  private client: MatrixClient | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    const homeserver = config.MATRIX_HOMESERVER;
    const token = config.MATRIX_ACCESS_TOKEN;
    const userId = config.MATRIX_USER_ID;
    if (!homeserver || !token || !userId) {
      throw new Error("MATRIX_HOMESERVER, MATRIX_ACCESS_TOKEN, MATRIX_USER_ID required");
    }
    this.client = createClient(homeserver, userId, token);
    this.client.startClient();

    this.client.on("Room.message" as any, async (roomId: string, event: any) => {
      if (!this.handler || event.type !== "m.room.message") return;
      const content = event.content;
      if (!content.body) return;
      await this.handler(
        { content: content.body, raw: event },
        event.sender ?? "",
      );
    });
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.client) throw new Error("MatrixChannel not initialized");
    await this.client.sendTextMessage(to, msg.content);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}