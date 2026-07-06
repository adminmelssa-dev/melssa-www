CREATE TYPE "academic_level" AS ENUM('level100', 'level200', 'level300', 'level400');--> statement-breakpoint
CREATE TYPE "announcement_category" AS ENUM('general', 'academic', 'events', 'resources', 'welfare');--> statement-breakpoint
CREATE TYPE "concern_category" AS ENUM('academic', 'welfare', 'facilities', 'harassment', 'finance', 'other');--> statement-breakpoint
CREATE TYPE "concern_status" AS ENUM('new', 'reviewing', 'resolved', 'archived');--> statement-breakpoint
CREATE TYPE "content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "event_status" AS ENUM('draft', 'published', 'cancelled');--> statement-breakpoint
CREATE TYPE "gallery_item_type" AS ENUM('event', 'seminar', 'health_screening', 'congress', 'outreach', 'other');--> statement-breakpoint
CREATE TYPE "resource_type" AS ENUM('lecture_slide', 'past_question', 'reference_material');--> statement-breakpoint
CREATE TYPE "semester_term" AS ENUM('first', 'second');--> statement-breakpoint
CREATE TYPE "storage_object_status" AS ENUM('completed', 'deleted');--> statement-breakpoint
CREATE TYPE "storage_provider" AS ENUM('uploadthing');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('student', 'contentAdmin', 'siteAdmin');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "courses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(40) NOT NULL CONSTRAINT "courses_code_unique" UNIQUE,
	"title" varchar(255) NOT NULL,
	"level" "academic_level" NOT NULL,
	"semester" "semester_term" NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lecturer_courses" (
	"lecturer_id" integer,
	"course_id" integer,
	CONSTRAINT "lecturer_courses_pk" PRIMARY KEY("lecturer_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "lecturers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lecturers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"title" varchar(120),
	"email" varchar(255),
	"phone" varchar(80),
	"office_location" varchar(255),
	"office_hours" text,
	"photo_storage_object_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"actor_user_id" text,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(100),
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'student'::"user_role" NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"last_login_at" timestamp,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anonymous_concerns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "anonymous_concerns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category" "concern_category" DEFAULT 'other'::"concern_category" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "concern_status" DEFAULT 'new'::"concern_status" NOT NULL,
	"attachment_storage_object_id" text,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp with time zone,
	"internal_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "announcements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"summary" text,
	"body" text NOT NULL,
	"category" "announcement_category" DEFAULT 'general'::"announcement_category" NOT NULL,
	"status" "content_status" DEFAULT 'draft'::"content_status" NOT NULL,
	"author_id" text,
	"attachment_storage_object_id" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"location" varchar(255),
	"status" "event_status" DEFAULT 'draft'::"event_status" NOT NULL,
	"poster_storage_object_id" text,
	"created_by_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gallery_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"caption" text,
	"type" "gallery_item_type" DEFAULT 'other'::"gallery_item_type" NOT NULL,
	"storage_object_id" text NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"captured_at" timestamp with time zone,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_spotlights" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "student_spotlights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"student_name" varchar(255) NOT NULL,
	"headline" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"status" "content_status" DEFAULT 'draft'::"content_status" NOT NULL,
	"photo_storage_object_id" text,
	"published_at" timestamp with time zone,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" "resource_type" NOT NULL,
	"level" "academic_level" NOT NULL,
	"semester" "semester_term" NOT NULL,
	"academic_year" varchar(20),
	"course_id" integer,
	"storage_object_id" text NOT NULL CONSTRAINT "resources_storage_object_unique" UNIQUE,
	"status" "content_status" DEFAULT 'draft'::"content_status" NOT NULL,
	"uploaded_by_user_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_type" varchar(100) NOT NULL,
	"recipient_emails" jsonb DEFAULT '[]',
	"recipient_roles" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "site_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key" varchar(100) NOT NULL UNIQUE,
	"value" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_objects" (
	"id" text PRIMARY KEY,
	"provider" "storage_provider" DEFAULT 'uploadthing'::"storage_provider" NOT NULL,
	"provider_object_id" text,
	"object_key" text NOT NULL CONSTRAINT "storage_objects_object_key_unique" UNIQUE,
	"public_url" text NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(160) NOT NULL,
	"byte_size" integer NOT NULL,
	"file_hash" text,
	"endpoint" varchar(80) NOT NULL,
	"status" "storage_object_status" DEFAULT 'completed'::"storage_object_status" NOT NULL,
	"uploaded_by_user_id" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "courses_level_semester_idx" ON "courses" ("level","semester");--> statement-breakpoint
CREATE INDEX "lecturers_name_idx" ON "lecturers" ("name");--> statement-breakpoint
CREATE INDEX "lecturers_email_idx" ON "lecturers" ("email");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_user_id_idx" ON "passkey" ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credential_id_idx" ON "passkey" ("credential_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_user_id_idx" ON "two_factor" ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_secret_idx" ON "two_factor" ("secret");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "anonymous_concerns_status_created_at_idx" ON "anonymous_concerns" ("status","created_at");--> statement-breakpoint
CREATE INDEX "anonymous_concerns_category_idx" ON "anonymous_concerns" ("category");--> statement-breakpoint
CREATE INDEX "announcements_status_published_at_idx" ON "announcements" ("status","published_at");--> statement-breakpoint
CREATE INDEX "announcements_category_idx" ON "announcements" ("category");--> statement-breakpoint
CREATE INDEX "events_status_starts_at_idx" ON "events" ("status","starts_at");--> statement-breakpoint
CREATE INDEX "events_created_by_idx" ON "events" ("created_by_id");--> statement-breakpoint
CREATE INDEX "gallery_items_type_idx" ON "gallery_items" ("type");--> statement-breakpoint
CREATE INDEX "gallery_items_featured_idx" ON "gallery_items" ("is_featured");--> statement-breakpoint
CREATE INDEX "student_spotlights_status_published_at_idx" ON "student_spotlights" ("status","published_at");--> statement-breakpoint
CREATE INDEX "resources_type_level_semester_idx" ON "resources" ("type","level","semester");--> statement-breakpoint
CREATE INDEX "resources_course_idx" ON "resources" ("course_id");--> statement-breakpoint
CREATE INDEX "resources_status_idx" ON "resources" ("status");--> statement-breakpoint
CREATE INDEX "notification_settings_event_type_idx" ON "notification_settings" ("event_type");--> statement-breakpoint
CREATE INDEX "storage_objects_uploaded_by_idx" ON "storage_objects" ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "storage_objects_endpoint_idx" ON "storage_objects" ("endpoint");--> statement-breakpoint
CREATE INDEX "storage_objects_status_idx" ON "storage_objects" ("status");--> statement-breakpoint
CREATE INDEX "storage_objects_status_created_at_idx" ON "storage_objects" ("status","created_at");--> statement-breakpoint
ALTER TABLE "lecturer_courses" ADD CONSTRAINT "lecturer_courses_lecturer_id_lecturers_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lecturer_courses" ADD CONSTRAINT "lecturer_courses_course_id_courses_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_photo_storage_object_id_storage_objects_id_fkey" FOREIGN KEY ("photo_storage_object_id") REFERENCES "storage_objects"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "anonymous_concerns" ADD CONSTRAINT "anonymous_concerns_mtN3mkZngHNe_fkey" FOREIGN KEY ("attachment_storage_object_id") REFERENCES "storage_objects"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "anonymous_concerns" ADD CONSTRAINT "anonymous_concerns_reviewed_by_user_id_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_user_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_ZaBvutcMAlpp_fkey" FOREIGN KEY ("attachment_storage_object_id") REFERENCES "storage_objects"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_poster_storage_object_id_storage_objects_id_fkey" FOREIGN KEY ("poster_storage_object_id") REFERENCES "storage_objects"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_storage_object_id_storage_objects_id_fkey" FOREIGN KEY ("storage_object_id") REFERENCES "storage_objects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "student_spotlights" ADD CONSTRAINT "student_spotlights_IJvfAsMICVSV_fkey" FOREIGN KEY ("photo_storage_object_id") REFERENCES "storage_objects"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "student_spotlights" ADD CONSTRAINT "student_spotlights_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_course_id_courses_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_storage_object_id_storage_objects_id_fkey" FOREIGN KEY ("storage_object_id") REFERENCES "storage_objects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaded_by_user_id_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "storage_objects" ADD CONSTRAINT "storage_objects_uploaded_by_user_id_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;