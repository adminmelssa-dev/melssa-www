CREATE TYPE "bulletin_delivery_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "bulletin_issue_status" AS ENUM('draft', 'sent', 'archived');--> statement-breakpoint
CREATE TABLE "bulletin_deliveries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bulletin_deliveries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"issue_id" integer NOT NULL,
	"subscription_id" text,
	"email" varchar(255) NOT NULL,
	"status" "bulletin_delivery_status" NOT NULL,
	"provider" varchar(40),
	"message_id" text,
	"error_message" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulletin_issues" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bulletin_issues_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"subject" varchar(180) NOT NULL,
	"preview_text" varchar(255),
	"editor_note" text NOT NULL,
	"sections" jsonb NOT NULL,
	"audience_tags" jsonb DEFAULT '[]' NOT NULL,
	"status" "bulletin_issue_status" DEFAULT 'draft'::"bulletin_issue_status" NOT NULL,
	"created_by_id" text,
	"updated_by_id" text,
	"sent_by_id" text,
	"sent_at" timestamp,
	"archived_at" timestamp,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"delivery_success_count" integer DEFAULT 0 NOT NULL,
	"delivery_failure_count" integer DEFAULT 0 NOT NULL,
	"last_delivery_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bulletin_deliveries_issue_id_idx" ON "bulletin_deliveries" ("issue_id");--> statement-breakpoint
CREATE INDEX "bulletin_deliveries_subscription_id_idx" ON "bulletin_deliveries" ("subscription_id");--> statement-breakpoint
CREATE INDEX "bulletin_deliveries_status_idx" ON "bulletin_deliveries" ("status");--> statement-breakpoint
CREATE INDEX "bulletin_deliveries_email_idx" ON "bulletin_deliveries" ("email");--> statement-breakpoint
CREATE INDEX "bulletin_issues_status_created_at_idx" ON "bulletin_issues" ("status","created_at");--> statement-breakpoint
CREATE INDEX "bulletin_issues_sent_at_idx" ON "bulletin_issues" ("sent_at");--> statement-breakpoint
CREATE INDEX "bulletin_issues_created_by_id_idx" ON "bulletin_issues" ("created_by_id");--> statement-breakpoint
CREATE INDEX "bulletin_issues_updated_by_id_idx" ON "bulletin_issues" ("updated_by_id");--> statement-breakpoint
CREATE INDEX "bulletin_issues_sent_by_id_idx" ON "bulletin_issues" ("sent_by_id");--> statement-breakpoint
ALTER TABLE "bulletin_deliveries" ADD CONSTRAINT "bulletin_deliveries_issue_id_bulletin_issues_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "bulletin_issues"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bulletin_deliveries" ADD CONSTRAINT "bulletin_deliveries_sv5t0imgacQN_fkey" FOREIGN KEY ("subscription_id") REFERENCES "bulletin_subscriptions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "bulletin_issues" ADD CONSTRAINT "bulletin_issues_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "bulletin_issues" ADD CONSTRAINT "bulletin_issues_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "bulletin_issues" ADD CONSTRAINT "bulletin_issues_sent_by_id_user_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "user"("id") ON DELETE SET NULL;