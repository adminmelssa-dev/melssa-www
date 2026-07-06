CREATE TABLE "auth_invitations" (
	"id" text PRIMARY KEY,
	"email" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_user_id" text,
	"accepted_by_user_id" text,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"last_sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulletin_subscriptions" (
	"id" text PRIMARY KEY,
	"email" varchar(255) NOT NULL,
	"source" varchar(80) DEFAULT 'footer' NOT NULL,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"last_subscribed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_invitations_email_idx" ON "auth_invitations" ("email");--> statement-breakpoint
CREATE INDEX "auth_invitations_invited_by_user_id_idx" ON "auth_invitations" ("invited_by_user_id");--> statement-breakpoint
CREATE INDEX "auth_invitations_accepted_by_user_id_idx" ON "auth_invitations" ("accepted_by_user_id");--> statement-breakpoint
CREATE INDEX "auth_invitations_expires_at_idx" ON "auth_invitations" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_invitations_token_hash_unique" ON "auth_invitations" ("token_hash");--> statement-breakpoint
CREATE INDEX "bulletin_subscriptions_unsubscribed_at_idx" ON "bulletin_subscriptions" ("unsubscribed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bulletin_subscriptions_email_unique" ON "bulletin_subscriptions" ("email");--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_invited_by_user_id_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_accepted_by_user_id_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;