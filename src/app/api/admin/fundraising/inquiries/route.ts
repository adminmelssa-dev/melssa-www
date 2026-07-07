import { NextResponse } from "next/server";
import { getSerializedFundraisingInquiryPage } from "@/modules/fundraising/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "fundraising",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedFundraisingInquiryPage(query);

  return NextResponse.json({ inquiries: page.items, meta: page.meta });
}
