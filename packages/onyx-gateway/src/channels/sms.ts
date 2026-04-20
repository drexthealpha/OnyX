import type { Channel, IncomingMessage } from "./index.js";

export class SMSChannel implements Channel {
  readonly name = "sms";
  private accountSid: string | null = null;
  private authToken: string | null = null;
  private from: string | null = null;
  private handler: ((msg: IncomingMessage, from: string) => Promise<void>) | null = null;

  async init(config: Record<string, string>): Promise<void> {
    this.accountSid = config.TWILIO_SID;
    this.authToken = config.TWILIO_TOKEN;
    this.from = config.TWILIO_FROM;
    if (!this.accountSid || !this.authToken || !this.from) {
      throw new Error("TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM required");
    }
    const credentials = btoa(`${this.accountSid}:${this.authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`,
      { headers: { Authorization: `Basic ${credentials}` } },
    );
    if (!response.ok) {
      throw new Error(`Twilio authentication failed: ${response.statusText}`);
    }
  }

  async send(msg: { content: string }, to: string): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.from) {
      throw new Error("SMSChannel not initialized");
    }
    const credentials = btoa(`${this.accountSid}:${this.authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: this.from,
          Body: msg.content,
        }).toString(),
      },
    );
    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage, from: string) => Promise<void>): void {
    this.handler = handler;
  }
}