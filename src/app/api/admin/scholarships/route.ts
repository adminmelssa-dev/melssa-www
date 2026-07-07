import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  createScholarshipProgramInputSchema,
  deleteScholarshipProgramInputSchema,
  updateScholarshipProgramInputSchema,
} from "@/modules/scholarships/contracts";
import { getSerializedScholarshipPrograms } from "@/modules/scholarships/queries";
import {
  createScholarshipProgram,
  deleteScholarshipProgram,
  updateScholarshipProgram,
} from "@/modules/scholarships/server/scholarships";
import { errorResult, successResult } from "@/lib/action-result";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET() {
  if (!env.SCHOLARSHIPS_ENABLED) return notFoundResponse();

  const guard = await requireApiPermission({
    resource: "scholarship",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const scholarshipPrograms = await getSerializedScholarshipPrograms();
  return NextResponse.json({ scholarshipPrograms });
}

export async function POST(request: Request) {
  if (!env.SCHOLARSHIPS_ENABLED) return notFoundResponse();

  const guard = await requireApiPermission({
    resource: "scholarship",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createScholarshipProgramInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "scholarship",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await createScholarshipProgram({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Scholarship programme created."));
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Scholarship programme creation failed."),
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!env.SCHOLARSHIPS_ENABLED) return notFoundResponse();

  const guard = await requireApiPermission({
    resource: "scholarship",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateScholarshipProgramInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "scholarship",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await updateScholarshipProgram({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Scholarship programme updated."));
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Scholarship programme update failed."),
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!env.SCHOLARSHIPS_ENABLED) return notFoundResponse();

  const guard = await requireApiPermission({
    resource: "scholarship",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteScholarshipProgramInputSchema.parse(body);

    await deleteScholarshipProgram({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Scholarship programme deleted."));
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Scholarship programme deletion failed."),
      { status: 400 },
    );
  }
}

function notFoundResponse(): NextResponse {
  return NextResponse.json(errorResult(null, "Not found."), { status: 404 });
}
