import {
  UserCheck,
  UserCog,
  UserX,
  Users,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminUserRow } from "@/modules/auth/contracts";
import { ROLES } from "@/modules/auth/roles";
import { getSerializedAdminUsers } from "@/modules/auth/queries";
import { UsersTable } from "@/modules/auth/components/users-table";
import { hasPermission, requirePermission } from "@/server/auth/guards";

interface UsersAdminStats {
  totalUsers: number;
  siteAdmins: number;
  verifiedUsers: number;
  restrictedUsers: number;
}

export async function UsersAdminPage() {
  const actorSession = await requirePermission({
    resource: "user",
    action: "list",
  });
  const users = await getSerializedAdminUsers();
  const stats = getUsersAdminStats(users);
  const permissions = {
    canSetRole: hasPermission(actorSession.user.role, {
      resource: "user",
      action: "set-role",
    }),
    canBan: hasPermission(actorSession.user.role, {
      resource: "user",
      action: "ban",
    }),
    canUpdate: hasPermission(actorSession.user.role, {
      resource: "user",
      action: "update",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Administration</p>
        <h1 className="font-heading text-2xl font-black">Users</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registered users"
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard label="Site admins" value={stats.siteAdmins} icon={UserCog} />
        <StatCard
          label="Verified accounts"
          value={stats.verifiedUsers}
          icon={UserCheck}
        />
        <StatCard
          label="Restricted"
          value={stats.restrictedUsers}
          icon={UserX}
        />
      </section>

      <UsersTable
        currentUserId={actorSession.user.id}
        initialUsers={users}
        permissions={permissions}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <CardTitle className="text-2xl font-black">{value}</CardTitle>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardHeader>
    </Card>
  );
}

function getUsersAdminStats(users: AdminUserRow[]): UsersAdminStats {
  return {
    totalUsers: users.length,
    siteAdmins: users.filter((item) => item.role === ROLES.SITE_ADMIN).length,
    verifiedUsers: users.filter((item) => item.emailVerified).length,
    restrictedUsers: users.filter((item) => item.banned).length,
  };
}
