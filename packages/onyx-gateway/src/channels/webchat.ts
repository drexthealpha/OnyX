import { WebSocketServer } from "ws";
import type { Channel, IncomingMessage } from "./index.js";

export class WebChatChannel implements Channel {
  readonly name = "webchat";
  private wss: WebSocketServer | null = null;
  private clients: Map<string, import("ws").WebSocket> = new Map();
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(_config: Record<string, string>): Promise<void> {
    this.wss = new WebSocketServer({ port: 18790 });
    this.wss.on("connection", (ws, req) => {
      const clientId = crypto.randomUUID();
      this.clients.set(clientId, ws);
      ws.on("message", async (data) => {
        if (!this.handler) return;
        const text = data.toString();
        await this.handler({ content: text }, clientId);
      });
      ws.on("close", () => this.clients.delete(clientId));
    });
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    const ws = this.clients.get(to);
    if (!ws) throw new Error(`WebChat client ${to} not connected`);
    ws.send(msg.content);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}