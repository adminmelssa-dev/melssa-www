import "server-only";

import type { MailMessage, MailSendResult, MailService } from "@/server/mail/types";

export class LogMailService implements MailService {
  async send(message: MailMessage): Promise<MailSendResult> {
    console.info("[mail:log]", {
      to: message.to,
      subject: message.subject,
      replyTo: message.replyTo,
      hasHtml: typeof message.html === "string",
      hasText: typeof message.text === "string",
    });

    return {
      provider: "log",
      messageId: null,
    };
  }
}
