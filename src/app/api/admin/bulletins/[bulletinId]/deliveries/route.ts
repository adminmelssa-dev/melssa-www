import { NextResponse } from "next/server";
import { getSerializedBulletinDeliveryPage } from "@/modules/bulletin/queries";
import { errorResult } from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

interface BulletinDeliveriesRouteContext {
  params: Promise<{
    bulletinId: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: BulletinDeliveriesRouteContext,
) {
  try {
    const guard = await requireApiPermission({
      resource: "bulletin",
      action: "read",
    });
    if (!guard.ok) return guard.response;

    const { bulletinId } = await params;
    const parsedBulletinId = Number(bulletinId);

    if (!Number.isInteger(parsedBulletinId) || parsedBulletinId <= 0) {
      return NextResponse.json(errorResult(null, "Bulletin not found."), {
        status: 404,
      });
    }

    const query = parseDataTableQuery(new URL(request.url).searchParams, {
      defaultPageSize: 8,
    });
    const page = await getSerializedBulletinDeliveryPage(
      parsedBulletinId,
      query,
    );

    return NextResponse.json({ deliveries: page.items, meta: page.meta });
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Bulletin deliveries failed to load."),
      { status: 400 },
    );
  }
}
