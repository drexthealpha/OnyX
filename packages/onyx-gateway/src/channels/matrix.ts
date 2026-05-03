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
    if (!homeserver || !token || !userId) throw new Error("MATRIX_HOMESERVER, MATRIX_ACCESS_TOKEN, MATRIX_USER_ID required");
    this.client = createClient({ baseUrl: homeserver, accessToken: token, userId });
    this.client.startClient();
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.client) throw new Error("MatrixChannel not initialized");
    await this.client.sendTextMessage(to, msg.content);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}