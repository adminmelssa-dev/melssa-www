import {
  emailBase,
  emailButton,
  emailDivider,
  emailHeading,
  emailMutedParagraph,
  emailParagraph,
  emailRawLink,
} from "@/server/mail/base";

export function verifyEmailTemplate(name: string, url: string): string {
  return authTemplate({
    body: [
      emailParagraph(`Hi ${name},`),
      emailParagraph(
        "Welcome to the MELSSA Student Portal. Verify your email address to activate your account and continue into the portal.",
      ),
    ].join(""),
    ctaLabel: "Verify email address",
    kicker: "Welcome",
    preheader: `Welcome to MELSSA, ${name}. Verify your email to get started.`,
    title: "Verify your email address",
    url,
  });
}

export function resetPasswordTemplate(name: string, url: string): string {
  return authTemplate({
    body: [
      emailParagraph(`Hi ${name},`),
      emailParagraph(
        "We received a request to reset the password for your MELSSA Student Portal account. Use the secure link below to choose a new password.",
      ),
    ].join(""),
    ctaLabel: "Reset password",
    kicker: "Account security",
    preheader:
      "Use this secure MELSSA Student Portal link to reset your password.",
    title: "Reset your portal password",
    url,
  });
}

interface AuthTemplateInput {
  body: string;
  ctaLabel: string;
  kicker: string;
  preheader: string;
  title: string;
  url: string;
}

function authTemplate({
  body,
  ctaLabel,
  kicker,
  preheader,
  title,
  url,
}: AuthTemplateInput): string {
  const emailBody = [
    emailHeading(kicker, title),
    body,
    emailButton(ctaLabel, url),
    emailMutedParagraph("If the button does not work, copy and paste this link into your browser:"),
    emailRawLink(url),
    emailDivider(),
    emailMutedParagraph(
      "If you did not request this email, you can safely ignore it. The link will expire automatically.",
    ),
  ].join("");

  return emailBase({ body: emailBody, preheader });
}
