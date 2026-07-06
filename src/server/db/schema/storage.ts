import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { storageObjectStatusEnum, storageProviderEnum } from "./enums";
import { timestamps } from "./helpers";

export type StorageObjectMetadataValue = string | number | boolean | null;
export type StorageObjectMetadata = Record<string, StorageObjectMetadataValue>;

export const storageObjects = pgTable(
  "storage_objects",
  {
    id: text("id").primaryKey(),
    provider: storageProviderEnum().notNull().default("uploadthing"),
    providerObjectId: text("provider_object_id"),
    objectKey: text("object_key").notNull(),
    publicUrl: text("public_url").notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 160 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    fileHash: text("file_hash"),
    endpoint: varchar("endpoint", { length: 80 }).notNull(),
    status: storageObjectStatusEnum().notNull().default("completed"),
    uploadedByUserId: text("uploaded_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<StorageObjectMetadata>().notNull().default({}),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    unique("storage_objects_object_key_unique").on(table.objectKey),
    index("storage_objects_uploaded_by_idx").on(table.uploadedByUserId),
    index("storage_objects_endpoint_idx").on(table.endpoint),
    index("storage_objects_status_idx").on(table.status),
    index("storage_objects_status_created_at_idx").on(table.status, table.createdAt),
  ],
);
