import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";
import type { MailMessage, MailSendResult, MailService } from "@/server/mail/types";

export class ResendMailService implements MailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor() {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
      throw new Error("Resend mail is not configured.");
    }

    this.resend = new Resend(env.RESEND_API_KEY);
    this.from = env.RESEND_FROM;
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const base = {
      from: this.from,
      to: message.to,
      subject: message.subject,
      replyTo: message.replyTo,
    };

    const text = message.text;

    const response = message.html
      ? await this.resend.emails.send({
          ...base,
          html: message.html,
          ...(text ? { text } : {}),
        })
      : await this.sendTextEmail(base, text);

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      provider: "resend",
      messageId: response.data.id,
    };
  }

  private async sendTextEmail(
    base: {
      from: string;
      to: string | string[];
      subject: string;
      replyTo?: string | string[];
    },
    text: string | undefined,
  ) {
    if (!text) {
      throw new Error("Text content is required when HTML content is not provided.");
    }

    return this.resend.emails.send({
      ...base,
      text,
    });
  }
}
