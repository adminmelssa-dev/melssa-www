import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { contentStatusSchema } from "@/modules/content/contracts";
import {
  scholarshipApplicationModeSchema,
  scholarshipProgramRowSchema,
  type ScholarshipProgramRow,
} from "@/modules/scholarships/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
import { db } from "@/server/db";
import {
  scholarshipPrograms,
  storageObjects,
  user,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

interface ScholarshipProgramListItem {
  id: number;
  title: string;
  slug: string;
  providerName: string;
  summary: string | null;
  description: string;
  status: ScholarshipProgramRow["status"];
  academicYear: string | null;
  amountDescription: string | null;
  eligibility: string | null;
  requirements: string | null;
  applicationMode: ScholarshipProgramRow["applicationMode"];
  applicationUrl: string | null;
  applicationInstructions: string | null;
  contactEmail: string | null;
  opensAt: Date | null;
  closesAt: Date | null;
  attachment: ScholarshipProgramRow["attachment"];
  creator: ScholarshipProgramRow["creator"];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ScholarshipProgramQueryRow {
  id: number;
  title: string;
  slug: string;
  providerName: string;
  summary: string | null;
  description: string;
  status: ScholarshipProgramRow["status"];
  academicYear: string | null;
  amountDescription: string | null;
  eligibility: string | null;
  requirements: string | null;
  applicationMode: ScholarshipProgramRow["applicationMode"];
  applicationUrl: string | null;
  applicationInstructions: string | null;
  contactEmail: string | null;
  opensAt: Date | null;
  closesAt: Date | null;
  attachmentId: string | null;
  attachmentPublicUrl: string | null;
  attachmentObjectKey: string | null;
  attachmentOriginalFilename: string | null;
  creatorId: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScholarshipAdminStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export async function getScholarshipPrograms(): Promise<
  ScholarshipProgramListItem[]
> {
  const rows = await scholarshipProgramSelect()
    .from(scholarshipPrograms)
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, scholarshipPrograms.attachmentStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(user, eq(user.id, scholarshipPrograms.createdById))
    .orderBy(
      asc(scholarshipPrograms.closesAt),
      desc(scholarshipPrograms.publishedAt),
      desc(scholarshipPrograms.createdAt),
    );

  return rows.map(mapScholarshipProgramRow);
}

export async function getPublishedScholarshipPrograms(): Promise<
  ScholarshipProgramListItem[]
> {
  const rows = await scholarshipProgramSelect()
    .from(scholarshipPrograms)
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, scholarshipPrograms.attachmentStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(user, eq(user.id, scholarshipPrograms.createdById))
    .where(eq(scholarshipPrograms.status, "published"))
    .orderBy(
      asc(scholarshipPrograms.closesAt),
      desc(scholarshipPrograms.publishedAt),
      desc(scholarshipPrograms.createdAt),
    );

  return rows.map(mapScholarshipProgramRow);
}

export function serializeScholarshipProgram(
  item: ScholarshipProgramListItem,
): ScholarshipProgramRow {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    providerName: item.providerName,
    summary: item.summary,
    description: item.description,
    status: item.status,
    academicYear: item.academicYear,
    amountDescription: item.amountDescription,
    eligibility: item.eligibility,
    requirements: item.requirements,
    applicationMode: item.applicationMode,
    applicationUrl: item.applicationUrl,
    applicationInstructions: item.applicationInstructions,
    contactEmail: item.contactEmail,
    opensAt: item.opensAt?.toISOString() ?? null,
    closesAt: item.closesAt?.toISOString() ?? null,
    attachment: item.attachment,
    creator: item.creator,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedScholarshipPrograms(): Promise<
  ScholarshipProgramRow[]
> {
  const programs = await getScholarshipPrograms();
  return programs.map((program) => serializeScholarshipProgram(program));
}

export async function getSerializedScholarshipProgramPage(
  query: DataTableQuery,
): Promise<DataTablePage<ScholarshipProgramRow>> {
  const where = getScholarshipProgramWhere(query);
  const totalRows = await db.$count(scholarshipPrograms, where);
  const rows = await scholarshipProgramSelect()
    .from(scholarshipPrograms)
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, scholarshipPrograms.attachmentStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(user, eq(user.id, scholarshipPrograms.createdById))
    .where(where)
    .orderBy(...getScholarshipProgramOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows
      .map(mapScholarshipProgramRow)
      .map((program) => serializeScholarshipProgram(program)),
    query,
    totalRows,
  });
}

export async function getScholarshipAdminStats(): Promise<ScholarshipAdminStats> {
  const [total, published, draft, archived] = await Promise.all([
    db.$count(scholarshipPrograms),
    db.$count(scholarshipPrograms, eq(scholarshipPrograms.status, "published")),
    db.$count(scholarshipPrograms, eq(scholarshipPrograms.status, "draft")),
    db.$count(scholarshipPrograms, eq(scholarshipPrograms.status, "archived")),
  ]);

  return {
    archived,
    draft,
    published,
    total,
  };
}

export async function getSerializedPublishedScholarshipPrograms(): Promise<
  ScholarshipProgramRow[]
> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.scholarships,
    load: async () => {
      const programs = await getPublishedScholarshipPrograms();
      return programs.map((program) => serializeScholarshipProgram(program));
    },
    schema: z.array(scholarshipProgramRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

function scholarshipProgramSelect() {
  return db.select({
    id: scholarshipPrograms.id,
    title: scholarshipPrograms.title,
    slug: scholarshipPrograms.slug,
    providerName: scholarshipPrograms.providerName,
    summary: scholarshipPrograms.summary,
    description: scholarshipPrograms.description,
    status: scholarshipPrograms.status,
    academicYear: scholarshipPrograms.academicYear,
    amountDescription: scholarshipPrograms.amountDescription,
    eligibility: scholarshipPrograms.eligibility,
    requirements: scholarshipPrograms.requirements,
    applicationMode: scholarshipPrograms.applicationMode,
    applicationUrl: scholarshipPrograms.applicationUrl,
    applicationInstructions: scholarshipPrograms.applicationInstructions,
    contactEmail: scholarshipPrograms.contactEmail,
    opensAt: scholarshipPrograms.opensAt,
    closesAt: scholarshipPrograms.closesAt,
    attachmentId: storageObjects.id,
    attachmentPublicUrl: storageObjects.publicUrl,
    attachmentObjectKey: storageObjects.objectKey,
    attachmentOriginalFilename: storageObjects.originalFilename,
    creatorId: user.id,
    creatorName: user.name,
    creatorEmail: user.email,
    publishedAt: scholarshipPrograms.publishedAt,
    createdAt: scholarshipPrograms.createdAt,
    updatedAt: scholarshipPrograms.updatedAt,
  });
}

function mapScholarshipProgramRow(
  row: ScholarshipProgramQueryRow,
): ScholarshipProgramListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    providerName: row.providerName,
    summary: row.summary,
    description: row.description,
    status: row.status,
    academicYear: row.academicYear,
    amountDescription: row.amountDescription,
    eligibility: row.eligibility,
    requirements: row.requirements,
    applicationMode: row.applicationMode,
    applicationUrl: row.applicationUrl,
    applicationInstructions: row.applicationInstructions,
    contactEmail: row.contactEmail,
    opensAt: row.opensAt,
    closesAt: row.closesAt,
    attachment:
      row.attachmentId &&
      row.attachmentPublicUrl &&
      row.attachmentObjectKey &&
      row.attachmentOriginalFilename
        ? {
            id: row.attachmentId,
            publicUrl: row.attachmentPublicUrl,
            objectKey: row.attachmentObjectKey,
            originalFilename: row.attachmentOriginalFilename,
          }
        : null,
    creator:
      row.creatorId && row.creatorName && row.creatorEmail
        ? {
            id: row.creatorId,
            name: row.creatorName,
            email: row.creatorEmail,
          }
        : null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getScholarshipProgramWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const statusFilters = getValidStatusFilters(
    getDataTableFilterValues(query, "status"),
  );
  const applicationModeFilters = getValidApplicationModeFilters(
    getDataTableFilterValues(query, "applicationMode"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(scholarshipPrograms.title, pattern),
      ilike(scholarshipPrograms.slug, pattern),
      ilike(scholarshipPrograms.providerName, pattern),
      ilike(scholarshipPrograms.summary, pattern),
      ilike(scholarshipPrograms.description, pattern),
      ilike(scholarshipPrograms.academicYear, pattern),
      ilike(scholarshipPrograms.amountDescription, pattern),
      ilike(scholarshipPrograms.contactEmail, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(scholarshipPrograms.status, statusFilters));
  }

  if (applicationModeFilters.length > 0) {
    conditions.push(
      inArray(scholarshipPrograms.applicationMode, applicationModeFilters),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getScholarshipProgramOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "title":
      return isAscending
        ? [asc(scholarshipPrograms.title), asc(scholarshipPrograms.id)]
        : [desc(scholarshipPrograms.title), desc(scholarshipPrograms.id)];
    case "status":
      return isAscending
        ? [asc(scholarshipPrograms.status), desc(scholarshipPrograms.id)]
        : [desc(scholarshipPrograms.status), desc(scholarshipPrograms.id)];
    case "applicationMode":
      return isAscending
        ? [
            asc(scholarshipPrograms.applicationMode),
            desc(scholarshipPrograms.id),
          ]
        : [
            desc(scholarshipPrograms.applicationMode),
            desc(scholarshipPrograms.id),
          ];
    case "closesAt":
      return isAscending
        ? [asc(scholarshipPrograms.closesAt), asc(scholarshipPrograms.id)]
        : [desc(scholarshipPrograms.closesAt), desc(scholarshipPrograms.id)];
    default:
      return [
        asc(scholarshipPrograms.closesAt),
        desc(scholarshipPrograms.publishedAt),
        desc(scholarshipPrograms.createdAt),
      ];
  }
}

function getValidStatusFilters(
  values: string[],
): ScholarshipProgramRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = contentStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidApplicationModeFilters(
  values: string[],
): ScholarshipProgramRow["applicationMode"][] {
  return values.flatMap((value) => {
    const parsedValue = scholarshipApplicationModeSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
