import { resolveUserRole } from "@/modules/auth/roles";
import { ResourcesAdminPage } from "@/modules/resources/components/resources-admin-page";
import { ResourcesStudentPage } from "@/modules/resources/components/resources-student-page";
import {
  getPermissionChecker,
  requireAuth,
} from "@/server/auth/guards";

export async function ResourcesDashboardPage() {
  const session = await requireAuth();
  const role = resolveUserRole(session.user.role);
  const permissions = await getPermissionChecker({
    role,
    userId: session.user.id,
  });

  if (permissions.has({ resource: "resource", action: "create" })) {
    return <ResourcesAdminPage />;
  }

  return <ResourcesStudentPage />;
}
