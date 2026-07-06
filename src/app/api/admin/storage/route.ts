import { NextResponse } from "next/server";
import { getSerializedStorageObjects } from "@/modules/storage/queries";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET() {
  const guard = await requireApiPermission({
    resource: "storage",
    action: "audit",
  });
  if (!guard.ok) return guard.response;

  const storageObjects = await getSerializedStorageObjects();

  return NextResponse.json({ storageObjects });
}
