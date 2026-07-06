import { describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

describe("auth email templates", () => {
  test("escapes user-controlled content inside the branded shell", async () => {
    setRequiredEnv();

    const { verifyEmailTemplate } = await import(
      "../../../../src/server/mail/templates/auth"
    );
    const html = verifyEmailTemplate(
      "<script>Student</script>",
      "https://portal.example.com/verify?token=<token>",
    );

    expect(html).toContain("MELSSA");
    expect(html).toContain("Medical Laboratory Science Students Association");
    expect(html).toContain("&lt;script&gt;Student&lt;/script&gt;");
    expect(html).toContain("token=&lt;token&gt;");
    expect(html).not.toContain("<script>Student</script>");
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
