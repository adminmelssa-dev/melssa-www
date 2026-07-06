CREATE TABLE "dashboard_notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dashboard_notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"type" varchar(100) NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"href" varchar(500),
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_rate_limits" (
	"key" text PRIMARY KEY,
	"scope" varchar(100) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "dashboard_notifications_user_created_at_idx" ON "dashboard_notifications" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "dashboard_notifications_user_read_at_idx" ON "dashboard_notifications" ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "public_rate_limits_scope_idx" ON "public_rate_limits" ("scope");--> statement-breakpoint
CREATE INDEX "public_rate_limits_reset_at_idx" ON "public_rate_limits" ("reset_at");--> statement-breakpoint
ALTER TABLE "dashboard_notifications" ADD CONSTRAINT "dashboard_notifications_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;