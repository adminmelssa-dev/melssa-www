export type MailDriver = "log" | "resend";

interface MailMessageBase {
  to: string | string[];
  subject: string;
  replyTo?: string | string[];
}

export type MailMessage =
  | (MailMessageBase & {
      html: string;
      text?: string;
    })
  | (MailMessageBase & {
      html?: string;
      text: string;
    });

export interface MailSendResult {
  provider: MailDriver;
  messageId: string | null;
}

export interface MailService {
  send(message: MailMessage): Promise<MailSendResult>;
}
