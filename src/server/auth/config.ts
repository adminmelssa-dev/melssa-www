import "server-only";

import { passkey } from "@better-auth/passkey";
import { and, eq, isNull } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { captcha } from "better-auth/plugins";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { env } from "@/lib/env";
import { createAdminPlugin } from "@/server/auth/admin-plugin";
import { sendEmail } from "@/server/mail";
import {
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "@/server/mail/templates/auth";
import { ROLES } from "@/modules/auth/roles";

const authUrl = new URL(env.BETTER_AUTH_URL);

const captchaPlugin = env.TURNSTILE_SECRET_KEY
  ? captcha({
      allowedHostnames:
        env.TURNSTILE_ALLOWED_HOSTNAMES.length > 0
          ? env.TURNSTILE_ALLOWED_HOSTNAMES
          : undefined,
      endpoints: ["/sign-up/email"],
      expectedAction: "signup",
      provider: "cloudflare-turnstile",
      secretKey: env.TURNSTILE_SECRET_KEY,
    })
  : null;

function isAllowedEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const domain = normalizedEmail.split("@")[1];

  const allowListsAreEmpty =
    env.AUTH_ALLOWED_EMAILS.length === 0 &&
    env.AUTH_ALLOWED_EMAIL_DOMAINS.length === 0;

  if (allowListsAreEmpty) return true;

  return (
    env.AUTH_ALLOWED_EMAILS.includes(normalizedEmail) ||
    (domain !== undefined && env.AUTH_ALLOWED_EMAIL_DOMAINS.includes(domain))
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          if (!isAllowedEmail(user.email)) {
            return false;
          }
        },
      },
    },
    session: {
      create: {
        async after(session) {
          if (session.impersonatedBy) return;

          await db
            .update(schema.user)
            .set({ lastLoginAt: new Date() })
            .where(
              and(
                eq(schema.user.id, session.userId),
                isNull(schema.user.banExpires),
              ),
            );
        },
      },
    },
  },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Verify your MELSSA portal account",
        html: verifyEmailTemplate(user.name, url),
      });
    },
    sendOnSignUp: env.AUTH_REQUIRE_EMAIL_VERIFICATION,
    autoSignInAfterVerification: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.AUTH_REQUIRE_EMAIL_VERIFICATION,
    customSyntheticUser({ coreFields, additionalFields, id }) {
      return {
        ...coreFields,
        ...additionalFields,
        id,
        role: ROLES.STUDENT,
        banned: false,
        banReason: null,
        banExpires: null,
      };
    },
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Reset your MELSSA portal password",
        html: resetPasswordTemplate(user.name, url),
      });
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  plugins: [
    createAdminPlugin(),
    ...(captchaPlugin ? [captchaPlugin] : []),
    passkey({
      rpID: authUrl.hostname,
      rpName: "MELSSA Student Portal",
      origin: authUrl.origin,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    }),
  ],
});
