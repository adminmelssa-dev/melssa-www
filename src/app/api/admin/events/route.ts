import { NextResponse } from "next/server";
import {
  createEventInputSchema,
  deleteEventInputSchema,
  updateEventInputSchema,
} from "@/modules/events/contracts";
import { getSerializedEventPage } from "@/modules/events/queries";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/modules/events/server/events";
import {
  errorResult,
  successResult,
} from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({ resource: "event", action: "read" });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedEventPage(query);

  return NextResponse.json({ events: page.items, meta: page.meta });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "event",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createEventInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "event",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await createEvent({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Event created."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Event creation failed."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "event",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateEventInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "event",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await updateEvent({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Event updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Event update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "event",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteEventInputSchema.parse(body);

    await deleteEvent({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Event deleted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Event deletion failed."), {
      status: 400,
    });
  }
}
