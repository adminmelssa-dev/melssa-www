"use client";

import * as React from "react";
import {
  CheckCircle2,
  Copy,
  MoreHorizontal,
  ShieldCheck,
  UserX,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminUsersResponseSchema,
  type AdminUserMutation,
  type AdminUserRow,
  userRoleSchema,
} from "@/modules/auth/contracts";
import { actionResultSchema } from "@/lib/action-result";
import { ROLE_LABELS, ROLES, type UserRole } from "@/modules/auth/roles";

const adminUsersQueryKey = ["admin-users"];

const roleOptions: UserRole[] = [
  ROLES.STUDENT,
  ROLES.CONTENT_ADMIN,
  ROLES.SITE_ADMIN,
];

const roleFilterOptions = roleOptions.map((role) => ({
  label: ROLE_LABELS[role],
  value: role,
}));

const accessFilterOptions = [
  { label: "Active", value: "active" },
  { label: "Restricted", value: "restricted" },
];

const verificationFilterOptions = [
  { label: "Verified", value: "verified" },
  { label: "Unverified", value: "unverified" },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface UsersTableProps {
  currentUserId: string;
  initialUsers: AdminUserRow[];
  permissions: UserTablePermissions;
}

interface UserTablePermissions {
  canSetRole: boolean;
  canBan: boolean;
  canUpdate: boolean;
}

export function UsersTable({
  currentUserId,
  initialUsers,
  permissions,
}: UsersTableProps) {
  const usersQuery = useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: fetchAdminUsers,
    initialData: { users: initialUsers },
  });

  const columns = React.useMemo(
    () => getColumns(currentUserId, permissions),
    [currentUserId, permissions],
  );

  return (
    <DataTable
      columns={columns}
      data={usersQuery.data.users}
      emptyState={
        <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
          <UserX className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No users found</p>
          <p className="text-xs text-muted-foreground">
            Adjust the search or filters and try again.
          </p>
        </div>
      }
      filters={[
        { columnId: "role", title: "Role", options: roleFilterOptions },
        {
          columnId: "accessStatus",
          title: "Access",
          options: accessFilterOptions,
        },
        {
          columnId: "verificationStatus",
          title: "Verification",
          options: verificationFilterOptions,
        },
      ]}
      getRowId={(user) => user.id}
      initialColumnVisibility={{
        accessStatus: false,
        verificationStatus: false,
      }}
      searchPlaceholder="Search by name or email..."
    />
  );
}

function getColumns(
  currentUserId: string,
  permissions: UserTablePermissions,
): ColumnDef<AdminUserRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="min-w-48 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{user.name}</span>
              {user.id === currentUserId ? (
                <Badge variant="secondary">You</Badge>
              ) : null}
            </div>
            <p className="break-all text-muted-foreground">{user.email}</p>
          </div>
        );
      },
      meta: { label: "User", className: "min-w-56" },
    },
    {
      accessorKey: "role",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => (
        <UserRoleControl
          disabled={row.original.id === currentUserId || !permissions.canSetRole}
          user={row.original}
        />
      ),
      meta: { label: "Role", className: "min-w-48" },
    },
    {
      accessorKey: "emailVerified",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) =>
        row.original.emailVerified ? (
          <Badge variant="secondary">Verified</Badge>
        ) : (
          <Badge variant="outline">Unverified</Badge>
        ),
      meta: { label: "Email Status" },
    },
    {
      id: "accessStatus",
      accessorFn: (row) => (row.banned ? "restricted" : "active"),
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Access" />
      ),
      cell: ({ row }) =>
        row.original.banned ? (
          <Badge variant="destructive">Restricted</Badge>
        ) : (
          <Badge variant="outline">Active</Badge>
        ),
      meta: { label: "Access" },
    },
    {
      id: "verificationStatus",
      accessorFn: (row) => (row.emailVerified ? "verified" : "unverified"),
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Verification" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("verificationStatus");
        return typeof value === "string" ? value : "";
      },
      meta: { label: "Verification" },
    },
    {
      accessorKey: "lastLoginAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Login" />
      ),
      cell: ({ row }) => formatDate(row.original.lastLoginAt),
      sortingFn: nullableDateSort,
      meta: { label: "Last Login" },
    },
    {
      accessorKey: "createdAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
      sortingFn: nullableDateSort,
      meta: { label: "Joined" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <UserRowActions
          currentUserId={currentUserId}
          permissions={permissions}
          user={row.original}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function UserRoleControl({
  disabled,
  user,
}: {
  disabled: boolean;
  user: AdminUserRow;
}) {
  const mutation = useAdminUserMutation();

  function updateRole(value: string): void {
    const parsedRole = userRoleSchema.safeParse(value);
    if (!parsedRole.success || parsedRole.data === user.role) return;

    mutation.mutate({
      type: "role",
      payload: {
        userId: user.id,
        role: parsedRole.data,
      },
    });
  }

  return (
    <div className="flex items-center gap-2">
      <RoleBadge role={user.role} />
      <Select
        disabled={disabled || mutation.isPending}
        onValueChange={updateRole}
        value={user.role}
      >
        <SelectTrigger
          aria-label={`Role for ${user.name}`}
          className="w-36"
          size="sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function UserRowActions({
  currentUserId,
  permissions,
  user,
}: {
  currentUserId: string;
  permissions: UserTablePermissions;
  user: AdminUserRow;
}) {
  const mutation = useAdminUserMutation();
  const isSelf = user.id === currentUserId;
  const canShowVerification = permissions.canUpdate;
  const canShowAccess = permissions.canBan;

  function mutate(mutationInput: AdminUserMutation): void {
    mutation.mutate(mutationInput);
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="size-8" size="icon" variant="ghost">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              void navigator.clipboard.writeText(user.email);
              toast.success("Email copied.");
            }}
          >
            <Copy className="size-4" />
            Copy email
          </DropdownMenuItem>
          {canShowVerification || canShowAccess ? (
            <DropdownMenuSeparator />
          ) : null}
          {canShowVerification ? (
            <DropdownMenuItem
              disabled={mutation.isPending}
              onClick={() =>
                mutate({
                  type: "verification",
                  payload: {
                    userId: user.id,
                    intent: user.emailVerified ? "unverify" : "verify",
                  },
                })
              }
            >
              <CheckCircle2 className="size-4" />
              {user.emailVerified ? "Mark unverified" : "Verify email"}
            </DropdownMenuItem>
          ) : null}
          {canShowAccess ? (
            user.banned ? (
              <DropdownMenuItem
                disabled={mutation.isPending}
                onClick={() =>
                  mutate({
                    type: "access",
                    payload: {
                      userId: user.id,
                      intent: "unban",
                    },
                  })
                }
              >
                <ShieldCheck className="size-4" />
                Restore access
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled={isSelf || mutation.isPending}
                onClick={() =>
                  mutate({
                    type: "access",
                    payload: {
                      userId: user.id,
                      intent: "ban",
                    },
                  })
                }
                variant="destructive"
              >
                <UserX className="size-4" />
                Restrict access
              </DropdownMenuItem>
            )
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === ROLES.SITE_ADMIN) {
    return (
      <Badge>
        <ShieldCheck className="size-3" />
        {ROLE_LABELS[role]}
      </Badge>
    );
  }

  if (role === ROLES.CONTENT_ADMIN) {
    return <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>;
  }

  return <Badge variant="outline">{ROLE_LABELS[role]}</Badge>;
}

function useAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchAdminUser,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
  });
}

async function fetchAdminUsers() {
  const response = await fetch("/api/admin/users", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success ? parsedError.data.message : "Failed to load users.",
    );
  }

  return adminUsersResponseSchema.parse(body);
}

async function patchAdminUser(mutation: AdminUserMutation) {
  const response = await fetch("/api/admin/users", {
    body: JSON.stringify(mutation),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function stringArrayFilter<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
): boolean {
  const selected = toStringArray(filterValue);
  if (selected.length === 0) return true;

  const value = row.getValue(columnId);
  return typeof value === "string" && selected.includes(value);
}

function nullableDateSort<TData>(
  first: Row<TData>,
  second: Row<TData>,
  columnId: string,
): number {
  return (
    dateValue(first.getValue(columnId)) - dateValue(second.getValue(columnId))
  );
}

function dateValue(value: unknown): number {
  return typeof value === "string" ? new Date(value).getTime() : 0;
}

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Never";
}
