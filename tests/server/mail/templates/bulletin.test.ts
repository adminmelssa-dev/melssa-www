import { describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

describe("bulletin email templates", () => {
  test("renders the branded bulletin welcome email", async () => {
    setRequiredEnv();

    const { bulletinWelcomeTemplate } = await import(
      "../../../../src/server/mail/templates/bulletin"
    );
    const html = bulletinWelcomeTemplate("https://portal.example.com");

    expect(html).toContain("Weekly Bulletin");
    expect(html).toContain("You are on the list");
    expect(html).toContain("https://portal.example.com");
    expect(html).toContain("MELSSA");
  });

  test("renders escaped bulletin issues with unsubscribe links", async () => {
    setRequiredEnv();

    const { bulletinIssueTemplate } = await import(
      "../../../../src/server/mail/templates/bulletin"
    );
    const html = bulletinIssueTemplate({
      title: "Week <7> brief",
      previewText: "Preview <text>",
      editorNote: "Read this before the lab week starts.",
      sections: [
        {
          heading: "Schedule <update>",
          body: "Level 300 practicals have moved to Friday.",
          category: "academic",
        },
      ],
      portalUrl: "https://portal.example.com",
      unsubscribeUrl:
        "https://portal.example.com/bulletin/unsubscribe?token=<token>",
    });

    expect(html).toContain("Week &lt;7&gt; brief");
    expect(html).toContain("Schedule &lt;update&gt;");
    expect(html).toContain("Unsubscribe from the weekly bulletin");
    expect(html).toContain("token=&lt;token&gt;");
    expect(html).not.toContain("Week <7> brief");
  });
});

function setRequiredEnv(): void {
  process.env.DATABASE_URL ??=
    "postgres://user:password@localhost:5432/melssa_portal";
  process.env.BETTER_AUTH_SECRET ??= "test-secret";
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
  process.env.AUTH_REQUIRE_EMAIL_VERIFICATION ??= "false";
  process.env.MAIL_DRIVER ??= "log";
  process.env.UPLOAD_DRIVER ??= "uploadthing";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "";
  process.env.TURNSTILE_SECRET_KEY = "";
}
