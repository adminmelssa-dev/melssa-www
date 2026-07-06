import "server-only";

import {
  emailBase,
  emailButton,
  emailDivider,
  emailHeading,
  emailMutedParagraph,
  emailParagraph,
  escapeHtml,
} from "@/server/mail/base";
import {
  BULLETIN_SECTION_CATEGORY_LABELS,
  type BulletinSection,
} from "@/modules/bulletin/contracts";

interface BulletinIssueTemplateInput {
  title: string;
  previewText: string | null;
  editorNote: string;
  sections: BulletinSection[];
  portalUrl: string;
  unsubscribeUrl: string;
}

export function bulletinWelcomeTemplate(portalUrl: string): string {
  return emailBase({
    preheader: "You are subscribed to the MELSSA Weekly Bulletin.",
    body: [
      emailHeading("Weekly Bulletin", "You are on the list"),
      emailParagraph(
        "You will receive MELSSA association news, academic resources, events, and student updates in your inbox.",
      ),
      emailParagraph(
        "The bulletin is designed to keep the whole association aligned without making you hunt through chats for important updates.",
      ),
      emailButton("Open the portal", portalUrl),
      emailDivider(),
      emailMutedParagraph(
        "You are receiving this because this email was subscribed to the MELSSA Weekly Bulletin.",
      ),
    ].join(""),
  });
}

export function bulletinIssueTemplate({
  title,
  previewText,
  editorNote,
  sections,
  portalUrl,
  unsubscribeUrl,
}: BulletinIssueTemplateInput): string {
  return emailBase({
    preheader: previewText ?? title,
    body: [
      emailHeading("Weekly Bulletin", title),
      richParagraph(editorNote),
      sections.map((section) => bulletinSection(section)).join(""),
      emailButton("Open the portal", portalUrl),
      emailDivider(),
      emailMutedParagraph(
        "You are receiving this because this email is subscribed to the MELSSA Weekly Bulletin.",
      ),
      unsubscribeLine(unsubscribeUrl),
    ].join(""),
  });
}

function bulletinSection(section: BulletinSection): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border:1px solid #E1D7C5;border-radius:10px;background:#FFFFFF;">
  <tr>
    <td style="padding:18px 20px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;line-height:1.5;letter-spacing:0.16em;text-transform:uppercase;color:#B9862B;">
        ${escapeHtml(BULLETIN_SECTION_CATEGORY_LABELS[section.category])}
      </p>
      <h2 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;line-height:1.2;color:#182338;">
        ${escapeHtml(section.heading)}
      </h2>
      ${richParagraph(section.body)}
    </td>
  </tr>
</table>`;
}

function richParagraph(value: string): string {
  const lines = escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br />"));

  return lines
    .map(
      (paragraph) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.72;color:#182338;">
  ${paragraph}
</p>`,
    )
    .join("");
}

function unsubscribeLine(unsubscribeUrl: string): string {
  return `<p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:#667085;">
  Prefer not to receive this? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0E2A54;text-decoration:underline;">Unsubscribe from the weekly bulletin</a>.
</p>`;
}
