import { createTransport, Transporter } from "nodemailer";
import type { Channel, IncomingMessage } from "./index.js";

export class EmailChannel implements Channel {
  readonly name = "email";
  private transporter: Transporter | null = null;
  private user: string | null = null;
  private pass: string | null = null;
  private host: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;
  private lastUid = 0;
  private polling = false;

  async init(config: Record<string, string>): Promise<void> {
    this.user = config.EMAIL_USER;
    this.pass = config.EMAIL_PASS;
    this.host = config.EMAIL_HOST;
    const port = parseInt(config.EMAIL_PORT || "587", 10);
    if (!this.user || !this.pass || !this.host) {
      throw new Error("EMAIL_USER, EMAIL_PASS, EMAIL_HOST required");
    }

    this.transporter = createTransport({
      host: this.host,
      port,
      secure: port === 465,
      auth: { user: this.user, pass: this.pass },
    });

    if (port === 993 || config.EMAIL_USE_IMAP === "true") {
      this.startPolling();
    }
  }

  private startPolling(): void {
    if (this.polling) return;
    this.polling = true;
    setInterval(() => this.poll(), 30000);
  }

  private async poll(): Promise<void> {
    if (!this.handler || !this.user || !this.pass || !this.host) return;
    try {
      const { ImapSimple } = await import("imap");
      const conn = await ImapSimple.connect({
        user: this.user,
        password: this.pass,
        host: this.host,
        port: 993,
        tls: true,
      });
      await conn.openBox("INBOX");
      const messages = await conn.searchUnseen();
      for (const msg of messages) {
        if (msg.uid <= this.lastUid) continue;
        const parts = await conn.getParts(msg.UID, [{ header: "from" }, { header: "subject" }]);
        const from = parts[0]?.value ?? "";
        const subject = parts[1]?.value ?? "";
        await this.handler({ content: String(subject) }, from);
        this.lastUid = msg.uid;
      }
      await conn.logout();
    } catch {
      // Ignore polling errors
    }
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.transporter) throw new Error("EmailChannel not initialized");
    await this.transporter.sendMail({
      from: this.user,
      to,
      subject: "Message from ONYX",
      text: msg.content,
    });
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}