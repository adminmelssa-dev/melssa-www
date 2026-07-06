import "server-only";

import sanitizeHtml from "sanitize-html";
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
      richTextBlock(editorNote),
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
      ${richTextBlock(section.body)}
    </td>
  </tr>
</table>`;
}

function richTextBlock(value: string): string {
  if (!looksLikeHtml(value)) {
    return plainTextParagraphs(value);
  }

  return sanitizeHtml(value, {
    allowedAttributes: {
      a: ["href", "rel", "style", "target"],
      blockquote: ["style"],
      li: ["style"],
      ol: ["style"],
      p: ["style"],
      ul: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedTags: [
      "a",
      "blockquote",
      "br",
      "em",
      "li",
      "ol",
      "p",
      "strong",
      "ul",
    ],
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noreferrer",
        style: "color:#0E2A54;text-decoration:underline;",
        target: "_blank",
      }),
      blockquote: sanitizeHtml.simpleTransform("blockquote", {
        style:
          "margin:18px 0;border-left:3px solid #B9862B;padding-left:14px;color:#182338;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.55;",
      }),
      li: sanitizeHtml.simpleTransform("li", {
        style: "margin:0 0 8px;font-size:15px;line-height:1.72;color:#182338;",
      }),
      ol: sanitizeHtml.simpleTransform("ol", {
        style: "margin:0 0 14px 20px;padding:0;",
      }),
      p: sanitizeHtml.simpleTransform("p", {
        style: "margin:0 0 14px;font-size:15px;line-height:1.72;color:#182338;",
      }),
      ul: sanitizeHtml.simpleTransform("ul", {
        style: "margin:0 0 14px 20px;padding:0;",
      }),
    },
  });
}

function plainTextParagraphs(value: string): string {
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

function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

function unsubscribeLine(unsubscribeUrl: string): string {
  return `<p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:#667085;">
  Prefer not to receive this? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0E2A54;text-decoration:underline;">Unsubscribe from the weekly bulletin</a>.
</p>`;
}
