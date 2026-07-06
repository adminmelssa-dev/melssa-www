import { resolveUserRole } from "@/modules/auth/roles";
import { ResourcesAdminPage } from "@/modules/resources/components/resources-admin-page";
import { ResourcesStudentPage } from "@/modules/resources/components/resources-student-page";
import { hasPermission, requireAuth } from "@/server/auth/guards";

export async function ResourcesDashboardPage() {
  const session = await requireAuth();
  const role = resolveUserRole(session.user.role);

  if (hasPermission(role, { resource: "resource", action: "create" })) {
    return <ResourcesAdminPage />;
  }

  return <ResourcesStudentPage />;
}
