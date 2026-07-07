"use client";

import * as React from "react";
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  Inbox,
  MessageSquareText,
  MoreHorizontal,
  ShieldAlert,
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
import { useServerDataTable } from "@/components/data-table/use-server-data-table";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CONCERN_CATEGORY_LABELS,
  CONCERN_CATEGORY_OPTIONS,
  CONCERN_STATUS_LABELS,
  CONCERN_STATUS_OPTIONS,
  adminConcernsResponseSchema,
  concernStatusSchema,
  updateConcernInputSchema,
  type ConcernRow,
  type ConcernStatus,
  type UpdateConcernInput,
} from "@/modules/concerns/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { DataTablePageMeta } from "@/lib/data-table-query";

const adminConcernsQueryKey = ["admin-concerns"];

const attachmentFilterOptions = [
  { label: "Has attachment", value: "has_attachment" },
  { label: "No attachment", value: "no_attachment" },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface ConcernFormValues {
  status: ConcernStatus;
  internalNote: string;
}

interface ConcernsTableProps {
  initialConcerns: ConcernRow[];
  initialMeta: DataTablePageMeta;
  permissions: ConcernTablePermissions;
}

interface ConcernTablePermissions {
  canUpdate: boolean;
  canArchive: boolean;
}

export function ConcernsTable({
  initialConcerns,
  initialMeta,
  permissions,
}: ConcernsTableProps) {
  const [reviewingConcern, setReviewingConcern] =
    React.useState<ConcernRow | null>(null);
  const queryClient = useQueryClient();
  const serverTable = useServerDataTable();
  const setPageMeta = serverTable.setPageMeta;

  const concernsQuery = useQuery({
    queryKey: [...adminConcernsQueryKey, serverTable.queryKey],
    queryFn: () => fetchAdminConcerns(serverTable.searchParams),
    initialData: { concerns: initialConcerns, meta: initialMeta },
  });

  React.useEffect(() => {
    setPageMeta({
      pageCount: concernsQuery.data.meta.pageCount,
      totalRows: concernsQuery.data.meta.totalRows,
    });
  }, [
    concernsQuery.data.meta.pageCount,
    concernsQuery.data.meta.totalRows,
    setPageMeta,
  ]);

  const columns = React.useMemo(
    () => getColumns({ onReview: setReviewingConcern, permissions }),
    [permissions],
  );

  return (
    <section className="space-y-3">
      <DataTable
        columns={columns}
        data={concernsQuery.data.concerns}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <MessageSquareText className="size-5" />
            </span>
            <p className="text-sm font-medium">No concerns found</p>
            <p className="text-xs text-muted-foreground">
              Anonymous student submissions will appear here.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "category",
            options: CONCERN_CATEGORY_OPTIONS,
            title: "Category",
          },
          {
            columnId: "status",
            options: CONCERN_STATUS_OPTIONS,
            title: "Status",
          },
          {
            columnId: "attachmentStatus",
            options: attachmentFilterOptions,
            title: "Attachment",
          },
        ]}
        getRowId={(concern) => String(concern.id)}
        initialColumnVisibility={{ attachmentStatus: false }}
        searchPlaceholder="Search concerns..."
        serverState={serverTable.state}
      />

      {reviewingConcern ? (
        <ConcernReviewDialog
          concern={reviewingConcern}
          key={`review-${reviewingConcern.id}`}
          onOpenChange={(open) => {
            if (!open) setReviewingConcern(null);
          }}
          onSaved={async () => {
            await queryClient.invalidateQueries({
              queryKey: adminConcernsQueryKey,
            });
            setReviewingConcern(null);
          }}
          open
          permissions={permissions}
        />
      ) : null}
    </section>
  );
}

function getColumns({
  onReview,
  permissions,
}: {
  onReview: (concern: ConcernRow) => void;
  permissions: ConcernTablePermissions;
}): ColumnDef<ConcernRow>[] {
  return [
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Concern" />
      ),
      cell: ({ row }) => {
        const concern = row.original;

        return (
          <div className="min-w-72 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{concern.subject}</span>
              <ConcernStatusBadge status={concern.status} />
            </div>
            <p className="max-w-xl truncate text-muted-foreground">
              {concern.message}
            </p>
          </div>
        );
      },
      meta: { label: "Concern", className: "min-w-72" },
    },
    {
      accessorKey: "category",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => CONCERN_CATEGORY_LABELS[row.original.category],
      meta: { label: "Category" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <ConcernStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      id: "attachment",
      accessorFn: (row) => row.attachment?.originalFilename ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Attachment" />
      ),
      cell: ({ row }) =>
        row.original.attachment ? (
          <a
            className="inline-flex max-w-48 items-center gap-1 truncate text-sm underline-offset-4 hover:underline"
            href={row.original.attachment.publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-3.5" />
            {row.original.attachment.originalFilename}
          </a>
        ) : (
          <span className="text-muted-foreground">None</span>
        ),
      meta: { label: "Attachment", className: "min-w-44" },
    },
    {
      id: "attachmentStatus",
      accessorFn: (row) =>
        row.attachment ? "has_attachment" : "no_attachment",
      filterFn: stringArrayFilter,
      header: "Attachment Status",
      meta: { label: "Attachment Status" },
    },
    {
      accessorKey: "createdAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Submitted" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
      sortingFn: dateSort,
      meta: { label: "Submitted" },
    },
    {
      accessorKey: "reviewedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reviewed" />
      ),
      cell: ({ row }) =>
        row.original.reviewedAt ? (
          formatDate(row.original.reviewedAt)
        ) : (
          <span className="text-muted-foreground">Not reviewed</span>
        ),
      sortingFn: dateSort,
      meta: { label: "Reviewed" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <ConcernRowActions
          concern={row.original}
          onReview={onReview}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function ConcernRowActions({
  concern,
  onReview,
  permissions,
}: {
  concern: ConcernRow;
  onReview: (concern: ConcernRow) => void;
  permissions: ConcernTablePermissions;
}) {
  const hasActions = permissions.canUpdate || concern.attachment;
  if (!hasActions) return null;

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
          {permissions.canUpdate ? (
            <DropdownMenuItem onSelect={() => onReview(concern)}>
              <ShieldAlert className="size-4" />
              Review concern
            </DropdownMenuItem>
          ) : null}
          {concern.attachment ? (
            <DropdownMenuItem asChild>
              <a
                href={concern.attachment.publicUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-4" />
                Open attachment
              </a>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ConcernReviewDialog({
  concern,
  onOpenChange,
  onSaved,
  open,
  permissions,
}: {
  concern: ConcernRow;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
  open: boolean;
  permissions: ConcernTablePermissions;
}) {
  const [values, setValues] = React.useState<ConcernFormValues>({
    status: concern.status,
    internalNote: concern.internalNote ?? "",
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminConcern,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await onSaved();
    },
  });

  function submitConcern(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const parsedInput = updateConcernInputSchema.safeParse({
      concernId: concern.id,
      status: values.status,
      internalNote: values.internalNote,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the review details.",
      );
      return;
    }

    updateMutation.mutate(parsedInput.data);
  }

  function updateStatus(value: string): void {
    const parsedStatus = concernStatusSchema.safeParse(value);
    if (!parsedStatus.success) return;

    setValues((current) => ({
      ...current,
      status: parsedStatus.data,
    }));
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{concern.subject}</DialogTitle>
          <DialogDescription>
            Anonymous submission in {CONCERN_CATEGORY_LABELS[concern.category]}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
          <p className="whitespace-pre-line">{concern.message}</p>
        </div>

        <form className="space-y-5" onSubmit={submitConcern}>
          <div className="space-y-2">
            <Label htmlFor="concern-status">Status</Label>
            <Select onValueChange={updateStatus} value={values.status}>
              <SelectTrigger id="concern-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONCERN_STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    disabled={
                      option.value === "archived" && !permissions.canArchive
                    }
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concern-internal-note">Internal note</Label>
            <Textarea
              className="min-h-28"
              id="concern-internal-note"
              maxLength={5_000}
              onChange={(changeEvent) =>
                setValues((current) => ({
                  ...current,
                  internalNote: changeEvent.currentTarget.value,
                }))
              }
              placeholder="Private follow-up notes"
              value={values.internalNote}
            />
          </div>

          <DialogFooter>
            <Button disabled={updateMutation.isPending} type="submit">
              Save review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConcernStatusBadge({ status }: { status: ConcernStatus }) {
  if (status === "new") {
    return (
      <Badge>
        <Inbox className="size-3" />
        {CONCERN_STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (status === "resolved") {
    return (
      <Badge variant="secondary">
        <CheckCircle2 className="size-3" />
        {CONCERN_STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (status === "archived") {
    return (
      <Badge variant="outline">
        <Archive className="size-3" />
        {CONCERN_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return <Badge variant="secondary">{CONCERN_STATUS_LABELS[status]}</Badge>;
}

async function fetchAdminConcerns(searchParams: string) {
  const url = searchParams
    ? `/api/admin/concerns?${searchParams}`
    : "/api/admin/concerns";
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load concerns.",
    );
  }

  return adminConcernsResponseSchema.parse(body);
}

async function updateAdminConcern(
  input: UpdateConcernInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/concerns", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Concern update failed.");
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

function dateSort<TData>(
  first: Row<TData>,
  second: Row<TData>,
  columnId: string,
): number {
  return dateValue(first.getValue(columnId)) - dateValue(second.getValue(columnId));
}

function dateValue(value: unknown): number {
  return typeof value === "string" ? new Date(value).getTime() : 0;
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}
