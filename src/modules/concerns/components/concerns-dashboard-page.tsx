import { resolveUserRole } from "@/modules/auth/roles";
import { ConcernsAdminPage } from "@/modules/concerns/components/concerns-admin-page";
import { ConcernsStudentPage } from "@/modules/concerns/components/concerns-student-page";
import { hasPermission, requireAuth } from "@/server/auth/guards";

export async function ConcernsDashboardPage() {
  const session = await requireAuth();
  const role = resolveUserRole(session.user.role);

  if (hasPermission(role, { resource: "concern", action: "read" })) {
    return <ConcernsAdminPage />;
  }

  return <ConcernsStudentPage />;
}
