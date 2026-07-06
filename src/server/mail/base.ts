import "server-only";

import { env } from "@/lib/env";

const brand = {
  paper: "#F6F1E7",
  raised: "#FBF8F1",
  ink: "#182338",
  muted: "#667085",
  navy: "#0E2A54",
  navySoft: "#123361",
  gold: "#B9862B",
  goldBright: "#DAA845",
  line: "#E1D7C5",
  white: "#FFFFFF",
};

interface EmailBaseInput {
  body: string;
  preheader: string;
}

export function emailBase({ body, preheader }: EmailBaseInput): string {
  const year = new Date().getFullYear();
  const appUrl = escapeHtml(env.NEXT_PUBLIC_APP_URL);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background:${brand.paper};color:${brand.ink};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;line-height:0;color:${brand.paper};opacity:0;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.paper};">
    <tr>
      <td style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:604px;margin:0 auto;">
          <tr>
            <td style="background:${brand.navy};border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:3px solid ${brand.gold};">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1;color:${brand.white};letter-spacing:0.01em;">
                MELSSA
              </p>
              <p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:${brand.goldBright};font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">
                Medical Laboratory Science Students Association
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:${brand.raised};padding:36px 32px 34px;border-left:1px solid ${brand.line};border-right:1px solid ${brand.line};">
              ${body}
            </td>
          </tr>

          <tr>
            <td style="background:${brand.navySoft};border-radius:0 0 12px 12px;padding:22px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.78);">
                MELSSA Student Portal
              </p>
              <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.54);">
                ${appUrl} &middot; &copy; ${year} MELSSA
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 10px;">
  <tr>
    <td style="border-radius:999px;background:${brand.navy};box-shadow:inset 0 -2px 0 rgba(0,0,0,0.16);">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:700;line-height:1.4;color:${brand.white};text-decoration:none;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

export function emailDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="border-top:1px solid ${brand.line};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
}

export function emailInfoCard(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      (row, index) => `<tr>
    <td style="padding:${index === 0 ? "16px 18px 10px" : "10px 18px"}${index === rows.length - 1 ? " 16px" : ""};">
      <p style="margin:0;font-size:11px;font-weight:700;line-height:1.5;letter-spacing:0.14em;text-transform:uppercase;color:${brand.gold};">
        ${escapeHtml(row.label)}
      </p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:650;line-height:1.55;color:${brand.ink};">
        ${escapeHtml(row.value)}
      </p>
    </td>
  </tr>
  ${
    index < rows.length - 1
      ? `<tr><td style="padding:0 18px;"><div style="height:1px;background:${brand.line};font-size:0;line-height:0;">&nbsp;</div></td></tr>`
      : ""
  }`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border:1px solid ${brand.line};border-left:4px solid ${brand.gold};border-radius:10px;background:${brand.white};">
  ${rowsHtml}
</table>`;
}

export function emailHeading(kicker: string, title: string): string {
  return `<p style="margin:0 0 10px;font-size:11px;font-weight:800;line-height:1.5;letter-spacing:0.18em;text-transform:uppercase;color:${brand.gold};">
  ${escapeHtml(kicker)}
</p>
<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;line-height:1.12;color:${brand.ink};">
  ${escapeHtml(title)}
</h1>`;
}

export function emailParagraph(value: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.72;color:${brand.ink};">
  ${escapeHtml(value)}
</p>`;
}

export function emailMutedParagraph(value: string): string {
  return `<p style="margin:0;font-size:13px;line-height:1.7;color:${brand.muted};">
  ${escapeHtml(value)}
</p>`;
}

export function emailRawLink(url: string): string {
  const safeUrl = escapeHtml(url);

  return `<p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:${brand.muted};word-break:break-all;">
  ${safeUrl}
</p>`;
}

export function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => {
    return replacements[character] ?? character;
  });
}
