import { NextResponse } from "next/server";
import {
  createAnnouncementInputSchema,
  deleteAnnouncementInputSchema,
  updateAnnouncementInputSchema,
} from "@/modules/announcements/contracts";
import { getSerializedAnnouncements } from "@/modules/announcements/queries";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/modules/announcements/server/announcements";
import { errorResult, successResult } from "@/lib/action-result";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET() {
  const guard = await requireApiPermission({
    resource: "announcement",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const announcements = await getSerializedAnnouncements();

  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "announcement",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createAnnouncementInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "announcement",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await createAnnouncement({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Announcement created."));
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Announcement creation failed."),
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "announcement",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateAnnouncementInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "announcement",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await updateAnnouncement({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Announcement updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Announcement update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "announcement",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteAnnouncementInputSchema.parse(body);

    await deleteAnnouncement({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Announcement deleted."));
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Announcement deletion failed."),
      { status: 400 },
    );
  }
}
