import { NextResponse } from "next/server";
import {
  createFinanceDocumentInputSchema,
  deleteFinanceDocumentInputSchema,
  updateFinanceDocumentInputSchema,
} from "@/modules/finance/contracts";
import { getSerializedFinanceDocumentPage } from "@/modules/finance/queries";
import {
  createFinanceDocument,
  deleteFinanceDocument,
  updateFinanceDocument,
} from "@/modules/finance/server/finance";
import { errorResult, successResult } from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "finance",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedFinanceDocumentPage(query);
  return NextResponse.json({ financeDocuments: page.items, meta: page.meta });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "finance",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createFinanceDocumentInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "finance",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await createFinanceDocument({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Finance document created."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Finance document creation failed."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "finance",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateFinanceDocumentInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "finance",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await updateFinanceDocument({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Finance document updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Finance document update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "finance",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteFinanceDocumentInputSchema.parse(body);

    await deleteFinanceDocument({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Finance document deleted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Finance document deletion failed."), {
      status: 400,
    });
  }
}
