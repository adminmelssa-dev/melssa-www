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
import {
  getSerializedAdminInvitationPage,
  getSerializedAdminUserPage,
  getUsersAdminStats,
} from "@/modules/auth/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { InvitationsPanel } from "@/modules/auth/components/invitations-panel";
import { UsersTable } from "@/modules/auth/components/users-table";
import { requirePermission } from "@/server/auth/guards";

export async function UsersAdminPage() {
  const actorSession = await requirePermission({
    resource: "user",
    action: "list",
  });
  const [userPage, stats] = await Promise.all([
    getSerializedAdminUserPage(parseDataTableQuery(new URLSearchParams())),
    getUsersAdminStats(),
  ]);
  const permissions = {
    canSetRole: actorSession.permissions.has({
      resource: "user",
      action: "set-role",
    }),
    canManagePermissions: actorSession.permissions.has({
      resource: "user",
      action: "manage-permissions",
    }),
    canBan: actorSession.permissions.has({
      resource: "user",
      action: "ban",
    }),
    canUpdate: actorSession.permissions.has({
      resource: "user",
      action: "update",
    }),
  };
  const invitationPage = permissions.canSetRole
    ? await getSerializedAdminInvitationPage(
        parseDataTableQuery(new URLSearchParams(), { defaultPageSize: 5 }),
      )
    : null;

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
        initialMeta={userPage.meta}
        initialUsers={userPage.items}
        permissions={permissions}
      />

      {permissions.canSetRole ? (
        <InvitationsPanel
          initialInvitations={invitationPage?.items ?? []}
          initialMeta={
            invitationPage?.meta ?? {
              pageCount: 1,
              pageIndex: 0,
              pageSize: 5,
              totalRows: 0,
            }
          }
        />
      ) : null}
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
