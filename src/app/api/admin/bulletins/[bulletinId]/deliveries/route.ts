import { NextResponse } from "next/server";
import { getSerializedBulletinDeliveries } from "@/modules/bulletin/queries";
import { errorResult } from "@/lib/action-result";
import { requireApiPermission } from "@/server/auth/api-guards";

interface BulletinDeliveriesRouteContext {
  params: Promise<{
    bulletinId: string;
  }>;
}

export async function GET(
  _request: Request,
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

    const deliveries = await getSerializedBulletinDeliveries(parsedBulletinId);

    return NextResponse.json({ deliveries });
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Bulletin deliveries failed to load."),
      { status: 400 },
    );
  }
}
