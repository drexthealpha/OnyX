import type { Channel, IncomingMessage } from "./index.js";

export class WhatsAppChannel implements Channel {
  readonly name = "whatsapp";
  private token: string | null = null;
  private phoneId: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.token = config.WHATSAPP_TOKEN;
    this.phoneId = config.WHATSAPP_PHONE_ID;
    if (!this.token || !this.phoneId) throw new Error("WHATSAPP_TOKEN and WHATSAPP_PHONE_ID required");
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.token || !this.phoneId) throw new Error("WhatsAppChannel not initialized");
    const res = await fetch(`https://graph.facebook.com/v18.0/${this.phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: msg.content } }),
    });
    if (!res.ok) throw new Error(`WhatsApp API error: ${res.statusText}`);
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }

  async handleWebhook(body: unknown): Promise<void> {
    if (!this.handler) return;
    try {
      const entries = (body as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ from: string; text: { body: string }> }> }> }>[]>)?.entry;
      if (!entries) return;
      for (const entry of entries) {
        const changes = entry.changes;
        if (!changes) continue;
        for (const change of changes) {
          const messages = change.value?.messages;
          if (!messages) continue;
          for (const msg of messages) {
            await this.handler({ content: msg.text.body, raw: body }, msg.from);
          }
        }
      }
    } catch {}
  }
}