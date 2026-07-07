import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "contentAdmin",
  "siteAdmin",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

export const announcementCategoryEnum = pgEnum("announcement_category", [
  "general",
  "academic",
  "events",
  "resources",
  "welfare",
]);

export const academicLevelEnum = pgEnum("academic_level", [
  "level100",
  "level200",
  "level300",
  "level400",
]);

export const semesterTermEnum = pgEnum("semester_term", [
  "first",
  "second",
]);

export const resourceTypeEnum = pgEnum("resource_type", [
  "lecture_slide",
  "past_question",
  "reference_material",
]);

export const storageProviderEnum = pgEnum("storage_provider", ["uploadthing"]);

export const storageObjectStatusEnum = pgEnum("storage_object_status", [
  "completed",
  "deleted",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
]);

export const concernCategoryEnum = pgEnum("concern_category", [
  "academic",
  "welfare",
  "facilities",
  "harassment",
  "finance",
  "other",
]);

export const concernStatusEnum = pgEnum("concern_status", [
  "new",
  "reviewing",
  "resolved",
  "archived",
]);

export const galleryItemTypeEnum = pgEnum("gallery_item_type", [
  "event",
  "seminar",
  "health_screening",
  "congress",
  "outreach",
  "other",
]);

export const bulletinIssueStatusEnum = pgEnum("bulletin_issue_status", [
  "draft",
  "sent",
  "archived",
]);

export const bulletinDeliveryStatusEnum = pgEnum("bulletin_delivery_status", [
  "sent",
  "failed",
]);

export const financeDocumentTypeEnum = pgEnum("finance_document_type", [
  "semester_report",
  "annual_report",
  "programme_budget",
]);

export const fundraisingInquiryStatusEnum = pgEnum(
  "fundraising_inquiry_status",
  ["new", "reviewing", "responded", "archived"],
);

export const scholarshipApplicationModeEnum = pgEnum(
  "scholarship_application_mode",
  ["information", "external"],
);
