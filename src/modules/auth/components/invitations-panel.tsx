"use client";

import * as React from "react";
import {
  Ban,
  Copy,
  MailPlus,
  MoreHorizontal,
  RefreshCcw,
  Send,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminInvitationsResponseSchema,
  inviteAdminUserInputSchema,
  type AdminInvitationMutation,
  type AdminInvitationRow,
  type AdminInvitationStatus,
  type InviteAdminUserInput,
} from "@/modules/auth/contracts";
import { actionResultSchema } from "@/lib/action-result";
import { ROLE_LABELS, ROLES, type UserRole } from "@/modules/auth/roles";

const adminInvitationsQueryKey = ["admin-invitations"];

const roleOptions: UserRole[] = [
  ROLES.STUDENT,
  ROLES.CONTENT_ADMIN,
  ROLES.SITE_ADMIN,
];

const roleFilterOptions = roleOptions.map((role) => ({
  label: ROLE_LABELS[role],
  value: role,
}));

const statusLabels: Record<AdminInvitationStatus, string> = {
  pending: "Pending",
  expired: "Expired",
  accepted: "Accepted",
  revoked: "Revoked",
};

const statusFilterOptions = Object.entries(statusLabels).map(
  ([value, label]) => ({
    label,
    value,
  }),
);

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface InvitationsPanelProps {
  initialInvitations: AdminInvitationRow[];
}

export function InvitationsPanel({
  initialInvitations,
}: InvitationsPanelProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const invitationsQuery = useQuery({
    queryKey: adminInvitationsQueryKey,
    queryFn: fetchAdminInvitations,
    initialData: { invitations: initialInvitations },
  });
  const columns = React.useMemo(() => getColumns(), []);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Role onboarding</p>
          <h2 className="font-heading text-xl font-black">Invitations</h2>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <MailPlus className="size-4" />
          Invite user
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={invitationsQuery.data.invitations}
        emptyState={
          <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
            <MailPlus className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No invitations found</p>
            <p className="text-xs text-muted-foreground">
              Sent invitations will appear here.
            </p>
          </div>
        }
        filters={[
          { columnId: "role", title: "Role", options: roleFilterOptions },
          { columnId: "status", title: "Status", options: statusFilterOptions },
        ]}
        getRowId={(invitation) => invitation.id}
        initialColumnVisibility={{
          createdAt: false,
          lastSentAt: false,
        }}
        initialPageSize={5}
        searchPlaceholder="Search invitations..."
      />

      <InviteUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
}

function InviteUserDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>(ROLES.CONTENT_ADMIN);
  const mutation = useCreateInvitationMutation({
    onSuccess() {
      setEmail("");
      setRole(ROLES.CONTENT_ADMIN);
      onOpenChange(false);
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsedInput = inviteAdminUserInputSchema.safeParse({ email, role });

    if (!parsedInput.success) {
      toast.error("Enter a valid email and role.");
      return;
    }

    mutation.mutate(parsedInput.data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Send a secure role invitation to an email address.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => {
                const parsedRole = inviteAdminUserInputSchema.shape.role.safeParse(
                  value,
                );
                if (parsedRole.success) setRole(parsedRole.data);
              }}
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {ROLE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Send className="size-4" />
              {mutation.isPending ? "Sending..." : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getColumns(): ColumnDef<AdminInvitationRow>[] {
  return [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invitee" />
      ),
      cell: ({ row }) => (
        <div className="min-w-48 space-y-1">
          <p className="break-all font-medium">{row.original.email}</p>
          <p className="text-muted-foreground">
            Expires {formatDate(row.original.expiresAt)}
          </p>
        </div>
      ),
      meta: { label: "Invitee", className: "min-w-56" },
    },
    {
      accessorKey: "role",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => <Badge variant="secondary">{ROLE_LABELS[row.original.role]}</Badge>,
      meta: { label: "Role" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      accessorKey: "lastSentAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Sent" />
      ),
      cell: ({ row }) => formatDate(row.original.lastSentAt),
      sortingFn: nullableDateSort,
      meta: { label: "Last Sent" },
    },
    {
      accessorKey: "createdAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
      sortingFn: nullableDateSort,
      meta: { label: "Created" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => <InvitationRowActions invitation={row.original} />,
      meta: { className: "w-12" },
    },
  ];
}

function InvitationRowActions({
  invitation,
}: {
  invitation: AdminInvitationRow;
}) {
  const mutation = useInvitationMutation();
  const canResend =
    invitation.status === "pending" || invitation.status === "expired";
  const canRevoke =
    invitation.status === "pending" || invitation.status === "expired";

  function mutate(mutationInput: AdminInvitationMutation): void {
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
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => {
              void navigator.clipboard.writeText(invitation.email);
              toast.success("Email copied.");
            }}
          >
            <Copy className="size-4" />
            Copy email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canResend || mutation.isPending}
            onClick={() =>
              mutate({ type: "resend", invitationId: invitation.id })
            }
          >
            <RefreshCcw className="size-4" />
            Resend invite
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRevoke || mutation.isPending}
            onClick={() =>
              mutate({ type: "revoke", invitationId: invitation.id })
            }
            variant="destructive"
          >
            <Ban className="size-4" />
            Revoke invite
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminInvitationStatus }) {
  if (status === "accepted") {
    return <Badge>{statusLabels[status]}</Badge>;
  }

  if (status === "revoked") {
    return <Badge variant="destructive">{statusLabels[status]}</Badge>;
  }

  if (status === "expired") {
    return <Badge variant="outline">{statusLabels[status]}</Badge>;
  }

  return <Badge variant="secondary">{statusLabels[status]}</Badge>;
}

function useCreateInvitationMutation({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postAdminInvitation,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      onSuccess();
      await queryClient.invalidateQueries({ queryKey: adminInvitationsQueryKey });
    },
    async onSettled() {
      await queryClient.invalidateQueries({ queryKey: adminInvitationsQueryKey });
    },
  });
}

function useInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchAdminInvitation,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminInvitationsQueryKey });
    },
    async onSettled() {
      await queryClient.invalidateQueries({ queryKey: adminInvitationsQueryKey });
    },
  });
}

async function fetchAdminInvitations() {
  const response = await fetch("/api/admin/invitations", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load invitations.",
    );
  }

  return adminInvitationsResponseSchema.parse(body);
}

async function postAdminInvitation(input: InviteAdminUserInput) {
  const response = await fetch("/api/admin/invitations", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message);
  }

  return result;
}

async function patchAdminInvitation(mutation: AdminInvitationMutation) {
  const response = await fetch("/api/admin/invitations", {
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
