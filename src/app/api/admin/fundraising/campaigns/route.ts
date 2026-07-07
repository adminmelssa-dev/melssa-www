import { NextResponse } from "next/server";
import { getSerializedFundraisingCampaignPage } from "@/modules/fundraising/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "fundraising",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedFundraisingCampaignPage(query);

  return NextResponse.json({ campaigns: page.items, meta: page.meta });
}
