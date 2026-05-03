import { createTransport, Transporter } from "nodemailer";
import type { Channel, IncomingMessage } from "./index.js";

export class EmailChannel implements Channel {
  readonly name = "email";
  private transporter: Transporter | null = null;
  private user: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.user = config.EMAIL_USER;
    const pass = config.EMAIL_PASS;
    const host = config.EMAIL_HOST;
    const port = parseInt(config.EMAIL_PORT || "587", 10);
    if (!this.user || !pass || !host) throw new Error("EMAIL_USER, EMAIL_PASS, EMAIL_HOST required");
    this.transporter = createTransport({ host, port, secure: port === 465, auth: { user: this.user, pass } });
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.transporter) throw new Error("EmailChannel not initialized");
    await this.transporter.sendMail({ from: this.user as string, to, subject: "Message from ONYX", text: msg.content });
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}