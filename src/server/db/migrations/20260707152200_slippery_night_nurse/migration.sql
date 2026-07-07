CREATE TYPE "finance_document_type" AS ENUM('semester_report', 'annual_report', 'programme_budget');--> statement-breakpoint
CREATE TYPE "fundraising_inquiry_status" AS ENUM('new', 'reviewing', 'responded', 'archived');--> statement-breakpoint
CREATE TYPE "scholarship_application_mode" AS ENUM('information', 'external');--> statement-breakpoint
CREATE TABLE "user_permission_grants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_permission_grants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"resource" varchar(80) NOT NULL,
	"action" varchar(80) NOT NULL,
	"granted_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_permission_grants_user_resource_action_unique" UNIQUE("user_id","resource","action")
);
--> statement-breakpoint
CREATE TABLE "finance_documents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "finance_documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"summary" text,
	"type" "finance_document_type" NOT NULL,
	"status" "content_status" DEFAULT 'draft'::"content_status" NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"semester" "semester_term",
	"programme_name" varchar(255),
	"date_presented" timestamp with time zone,
	"storage_object_id" text NOT NULL CONSTRAINT "finance_documents_storage_object_unique" UNIQUE,
	"created_by_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fundraising_campaigns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fundraising_campaigns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"slug" varchar(180) NOT NULL CONSTRAINT "fundraising_campaigns_slug_unique" UNIQUE,
	"summary" text,
	"body" text NOT NULL,
	"status" "content_status" DEFAULT 'draft'::"content_status" NOT NULL,
	"goal_amount_minor" integer,
	"currency" varchar(3) DEFAULT 'GHS' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"payment_instructions" text,
	"payment_methods" jsonb DEFAULT '[]' NOT NULL,
	"sponsorship_tiers" jsonb DEFAULT '[]' NOT NULL,
	"cover_storage_object_id" text,
	"created_by_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fundraising_inquiries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fundraising_inquiries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"campaign_id" integer,
	"organization_name" varchar(255),
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"phone" varchar(80),
	"message" text NOT NULL,
	"status" "fundraising_inquiry_status" DEFAULT 'new'::"fundraising_inquiry_status" NOT NULL,
	"reviewed_by_user_id" text,
	"internal_notes" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship_programs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scholarship_programs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"slug" varchar(180) NOT NULL UNIQUE,
	"provider_name" varchar(255) NOT NULL,
	"summary" text,
	"description" text NOT NULL,
	"status" "content_status" DEFAULT 'draft'::"content_status" NOT NULL,
	"academic_year" varchar(20),
	"amount_description" varchar(255),
	"eligibility" text,
	"requirements" text,
	"application_mode" "scholarship_application_mode" DEFAULT 'external'::"scholarship_application_mode" NOT NULL,
	"application_url" text,
	"application_instructions" text,
	"contact_email" varchar(255),
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"attachment_storage_object_id" text,
	"created_by_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_permission_grants_user_idx" ON "user_permission_grants" ("user_id");--> statement-breakpoint
CREATE INDEX "user_permission_grants_permission_idx" ON "user_permission_grants" ("resource","action");--> statement-breakpoint
CREATE INDEX "finance_documents_status_published_at_idx" ON "finance_documents" ("status","published_at");--> statement-breakpoint
CREATE INDEX "finance_documents_type_year_idx" ON "finance_documents" ("type","academic_year");--> statement-breakpoint
CREATE INDEX "fundraising_campaigns_status_published_at_idx" ON "fundraising_campaigns" ("status","published_at");--> statement-breakpoint
CREATE INDEX "fundraising_inquiries_campaign_idx" ON "fundraising_inquiries" ("campaign_id");--> statement-breakpoint
CREATE INDEX "fundraising_inquiries_status_created_at_idx" ON "fundraising_inquiries" ("status","created_at");--> statement-breakpoint
CREATE INDEX "scholarship_programs_status_closes_at_idx" ON "scholarship_programs" ("status","closes_at");--> statement-breakpoint
CREATE INDEX "scholarship_programs_academic_year_idx" ON "scholarship_programs" ("academic_year");--> statement-breakpoint
ALTER TABLE "user_permission_grants" ADD CONSTRAINT "user_permission_grants_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_grants" ADD CONSTRAINT "user_permission_grants_granted_by_user_id_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_storage_object_id_storage_objects_id_fkey" FOREIGN KEY ("storage_object_id") REFERENCES "storage_objects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "fundraising_campaigns" ADD CONSTRAINT "fundraising_campaigns_tC9i9AG3J7fp_fkey" FOREIGN KEY ("cover_storage_object_id") REFERENCES "storage_objects"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "fundraising_campaigns" ADD CONSTRAINT "fundraising_campaigns_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "fundraising_inquiries" ADD CONSTRAINT "fundraising_inquiries_campaign_id_fundraising_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "fundraising_campaigns"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "fundraising_inquiries" ADD CONSTRAINT "fundraising_inquiries_reviewed_by_user_id_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "scholarship_programs" ADD CONSTRAINT "scholarship_programs_S2fFr6ilJnwn_fkey" FOREIGN KEY ("attachment_storage_object_id") REFERENCES "storage_objects"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "scholarship_programs" ADD CONSTRAINT "scholarship_programs_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;