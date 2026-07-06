import { NextResponse } from "next/server";
import { getSerializedAuditLogs } from "@/modules/audit/queries";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET() {
  const guard = await requireApiPermission({ resource: "audit", action: "read" });
  if (!guard.ok) return guard.response;

  const auditLogs = await getSerializedAuditLogs();

  return NextResponse.json({ auditLogs });
}
