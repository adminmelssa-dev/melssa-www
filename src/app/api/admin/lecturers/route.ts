import { NextResponse } from "next/server";
import {
  createLecturerInputSchema,
  deleteLecturerInputSchema,
  updateLecturerInputSchema,
} from "@/modules/lecturers/contracts";
import { getSerializedLecturers } from "@/modules/lecturers/queries";
import {
  createLecturer,
  deleteLecturer,
  updateLecturer,
} from "@/modules/lecturers/server/lecturers";
import { errorResult, successResult } from "@/lib/action-result";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET() {
  const guard = await requireApiPermission({
    resource: "lecturer",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const lecturers = await getSerializedLecturers();

  return NextResponse.json({ lecturers });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "lecturer",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createLecturerInputSchema.parse(body);

    await createLecturer({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Lecturer created."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Lecturer creation failed."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "lecturer",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateLecturerInputSchema.parse(body);

    await updateLecturer({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Lecturer updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Lecturer update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "lecturer",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteLecturerInputSchema.parse(body);

    await deleteLecturer({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Lecturer deleted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Lecturer deletion failed."), {
      status: 400,
    });
  }
}
