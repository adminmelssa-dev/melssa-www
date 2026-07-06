import "server-only";

import { env } from "@/lib/env";
import { LogMailService } from "@/server/mail/providers/log";
import { ResendMailService } from "@/server/mail/providers/resend";
import type { MailMessage, MailSendResult, MailService } from "@/server/mail/types";

let mailService: MailService | null = null;

export function getMailService(): MailService {
  if (mailService) return mailService;

  mailService =
    env.MAIL_DRIVER === "resend" ? new ResendMailService() : new LogMailService();

  return mailService;
}

export function sendEmail(message: MailMessage): Promise<MailSendResult> {
  return getMailService().send(message);
}
