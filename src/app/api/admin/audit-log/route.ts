import { NextResponse } from "next/server";
import { getSerializedAuditLogPage } from "@/modules/audit/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({ resource: "audit", action: "read" });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams, {
    defaultPageSize: 20,
  });
  const page = await getSerializedAuditLogPage(query);

  return NextResponse.json({ auditLogs: page.items, meta: page.meta });
}
