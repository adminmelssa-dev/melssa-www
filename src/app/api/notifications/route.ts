import { NextResponse } from "next/server";
import { getSerializedDashboardNotifications } from "@/modules/notifications/queries";
import { dashboardNotificationMutationSchema } from "@/modules/notifications/contracts";
import { mutateDashboardNotification } from "@/modules/notifications/server/notifications";
import { errorResult, successResult } from "@/lib/action-result";
import { requireApiAuth } from "@/server/auth/api-guards";

export async function GET() {
  const guard = await requireApiAuth();
  if (!guard.ok) return guard.response;

  const notifications = await getSerializedDashboardNotifications(
    guard.session.user.id,
  );

  return NextResponse.json(notifications);
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireApiAuth();
    if (!guard.ok) return guard.response;

    const body: unknown = await request.json();
    const mutation = dashboardNotificationMutationSchema.parse(body);

    await mutateDashboardNotification({
      mutation,
      userId: guard.session.user.id,
    });

    return NextResponse.json(successResult("Notification updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Notification update failed."), {
      status: 400,
    });
  }
}
