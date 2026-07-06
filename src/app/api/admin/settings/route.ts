import { NextResponse } from "next/server";
import { updateSettingsInputSchema } from "@/modules/settings/contracts";
import { getAdminSettings } from "@/modules/settings/queries";
import { updateAdminSettings } from "@/modules/settings/server/settings";
import {
  errorResult,
  successResult,
} from "@/lib/action-result";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET() {
  const guard = await requireApiPermission({
    resource: "settings",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const settings = await getAdminSettings();

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "settings",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateSettingsInputSchema.parse(body);

    await updateAdminSettings({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Settings updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Settings update failed."), {
      status: 400,
    });
  }
}
