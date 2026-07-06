import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword } from "better-auth/crypto";
import { config as loadEnv } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { ROLES } from "../src/modules/auth/roles";
import { createAdminPlugin } from "../src/server/auth/admin-plugin";
import * as schema from "../src/server/db/schema";

loadEnv({ path: ".env.local" });
loadEnv();

type CredentialPasswordResult = "created" | "updated" | "kept";

const { env } = await import("../src/lib/env");

const db = drizzle(env.DATABASE_URL);

const bootstrapAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [createAdminPlugin()],
});

await main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Admin bootstrap failed.";

  console.error(message);
  process.exit(1);
});

async function main() {
  const email = requireBootstrapValue(
    env.INITIAL_SITE_ADMIN_EMAIL,
    "INITIAL_SITE_ADMIN_EMAIL",
  ).toLowerCase();
  const password = requireBootstrapValue(
    env.INITIAL_SITE_ADMIN_PASSWORD,
    "INITIAL_SITE_ADMIN_PASSWORD",
  );
  const name = env.INITIAL_SITE_ADMIN_NAME ?? "MELSSA Site Admin";

  const [existingUser] = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      emailVerified: schema.user.emailVerified,
      role: schema.user.role,
    })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  if (!existingUser) {
    const result = await bootstrapAuth.api.createUser({
      body: {
        email,
        password,
        name,
        role: ROLES.SITE_ADMIN,
        data: {
          banned: false,
          banExpires: null,
          banReason: null,
          emailVerified: true,
          twoFactorEnabled: false,
        },
      },
    });

    console.log(`Created site admin account for ${result.user.email}.`);
    return;
  }

  await db
    .update(schema.user)
    .set({
      banned: false,
      banExpires: null,
      banReason: null,
      emailVerified: true,
      role: ROLES.SITE_ADMIN,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, existingUser.id));

  const credentialPasswordResult = await ensureCredentialPassword(
    existingUser.id,
    password,
    env.INITIAL_SITE_ADMIN_RESET_PASSWORD,
  );

  console.log(
    [
      `Promoted and verified existing account for ${existingUser.email}.`,
      passwordResultMessage(credentialPasswordResult),
    ].join(" "),
  );
}

function requireBootstrapValue(
  value: string | undefined,
  name: string,
): string {
  if (!value) {
    throw new Error(`${name} must be set before running admin bootstrap.`);
  }

  return value;
}

async function ensureCredentialPassword(
  userId: string,
  password: string,
  resetExistingPassword: boolean,
): Promise<CredentialPasswordResult> {
  const [credentialAccount] = await db
    .select({
      id: schema.account.id,
      password: schema.account.password,
    })
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "credential"),
      ),
    )
    .limit(1);

  if (
    credentialAccount &&
    credentialAccount.password &&
    !resetExistingPassword
  ) {
    return "kept";
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  if (credentialAccount) {
    await db
      .update(schema.account)
      .set({
        password: passwordHash,
        updatedAt: now,
      })
      .where(eq(schema.account.id, credentialAccount.id));

    return "updated";
  }

  await db.insert(schema.account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  return "created";
}

function passwordResultMessage(result: CredentialPasswordResult): string {
  if (result === "created") {
    return "Created a credential password from INITIAL_SITE_ADMIN_PASSWORD.";
  }

  if (result === "updated") {
    return "Updated the credential password from INITIAL_SITE_ADMIN_PASSWORD.";
  }

  return "Existing credential password was left unchanged.";
}
