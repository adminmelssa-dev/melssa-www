import { NextResponse } from "next/server";
import {
  createCourseInputSchema,
  deleteCourseInputSchema,
  updateCourseInputSchema,
} from "@/modules/academics/contracts";
import { getSerializedCourses } from "@/modules/academics/queries";
import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "@/modules/academics/server/courses";
import { errorResult, successResult } from "@/lib/action-result";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET() {
  const guard = await requireApiPermission({ resource: "course", action: "read" });
  if (!guard.ok) return guard.response;

  const courses = await getSerializedCourses();

  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "course",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createCourseInputSchema.parse(body);

    await createCourse({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Course created."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Course creation failed."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "course",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateCourseInputSchema.parse(body);

    await updateCourse({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Course updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Course update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "course",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteCourseInputSchema.parse(body);

    await deleteCourse({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Course deleted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Course deletion failed."), {
      status: 400,
    });
  }
}
