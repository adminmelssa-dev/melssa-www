"use client";

import * as React from "react";
import {
  Archive,
  Edit3,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
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
import { StorageUploadField } from "@/components/storage/upload-field";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  adminSpotlightsResponseSchema,
  contentStatusSchema,
  createSpotlightInputSchema,
  type ContentStatus,
  type CreateSpotlightInput,
  type SpotlightRow,
  type UpdateSpotlightInput,
} from "@/modules/spotlights/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminSpotlightsQueryKey = ["admin-spotlights"];

const photoFilterOptions = [
  { label: "Has photo", value: "has_photo" },
  { label: "No photo", value: "no_photo" },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface SpotlightFormValues {
  studentName: string;
  headline: string;
  body: string;
  status: ContentStatus;
  photo: UploadedStorageObject | null;
}

interface SpotlightsTableProps {
  initialSpotlights: SpotlightRow[];
  permissions: SpotlightTablePermissions;
}

interface SpotlightTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export function SpotlightsTable({
  initialSpotlights,
  permissions,
}: SpotlightsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingSpotlight, setEditingSpotlight] =
    React.useState<SpotlightRow | null>(null);
  const [deletingSpotlight, setDeletingSpotlight] =
    React.useState<SpotlightRow | null>(null);
  const queryClient = useQueryClient();

  const spotlightsQuery = useQuery({
    queryKey: adminSpotlightsQueryKey,
    queryFn: fetchAdminSpotlights,
    initialData: { spotlights: initialSpotlights },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminSpotlight,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingSpotlight(null);
      await queryClient.invalidateQueries({
        queryKey: adminSpotlightsQueryKey,
      });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingSpotlight,
        onEdit: setEditingSpotlight,
        permissions,
      }),
    [permissions],
  );

  return (
    <section className="space-y-3">
      {permissions.canCreate ? (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            New spotlight
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={spotlightsQuery.data.spotlights}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <Sparkles className="size-5" />
            </span>
            <p className="text-sm font-medium">No spotlights found</p>
            <p className="text-xs text-muted-foreground">
              Published student stories will appear on the public site.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "status",
            options: CONTENT_STATUS_OPTIONS,
            title: "Status",
          },
          {
            columnId: "photoStatus",
            options: photoFilterOptions,
            title: "Photo",
          },
        ]}
        getRowId={(spotlight) => String(spotlight.id)}
        initialColumnVisibility={{ photoStatus: false }}
        searchPlaceholder="Search spotlights..."
      />

      <SpotlightDialog
        key="create-spotlight"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
        permissions={permissions}
      />

      {editingSpotlight && permissions.canUpdate ? (
        <SpotlightDialog
          key={`edit-${editingSpotlight.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingSpotlight(null);
          }}
          open
          permissions={permissions}
          spotlight={editingSpotlight}
        />
      ) : null}

      <DeleteSpotlightDialog
        isPending={deleteMutation.isPending}
        onDelete={(spotlightId) => deleteMutation.mutate({ spotlightId })}
        onOpenChange={(open) => {
          if (!open) setDeletingSpotlight(null);
        }}
        spotlight={deletingSpotlight}
      />
    </section>
  );
}

function getColumns({
  onDelete,
  onEdit,
  permissions,
}: {
  onDelete: (spotlight: SpotlightRow) => void;
  onEdit: (spotlight: SpotlightRow) => void;
  permissions: SpotlightTablePermissions;
}): ColumnDef<SpotlightRow>[] {
  return [
    {
      accessorKey: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      cell: ({ row }) => {
        const spotlight = row.original;

        return (
          <div className="min-w-72 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{spotlight.studentName}</span>
              <SpotlightStatusBadge status={spotlight.status} />
            </div>
            <p className="max-w-xl truncate text-muted-foreground">
              {spotlight.headline}
            </p>
          </div>
        );
      },
      meta: { label: "Student", className: "min-w-72" },
    },
    {
      accessorKey: "headline",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Headline" />
      ),
      meta: { label: "Headline", className: "min-w-56" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <SpotlightStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      id: "photo",
      accessorFn: (row) => row.photo?.originalFilename ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Photo" />
      ),
      cell: ({ row }) =>
        row.original.photo ? (
          <a
            className="inline-flex max-w-48 items-center gap-1 truncate text-sm underline-offset-4 hover:underline"
            href={row.original.photo.publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-3.5" />
            {row.original.photo.originalFilename}
          </a>
        ) : (
          <span className="text-muted-foreground">None</span>
        ),
      meta: { label: "Photo", className: "min-w-44" },
    },
    {
      id: "photoStatus",
      accessorFn: (row) => (row.photo ? "has_photo" : "no_photo"),
      filterFn: stringArrayFilter,
      header: "Photo Status",
      meta: { label: "Photo Status" },
    },
    {
      accessorKey: "publishedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Published" />
      ),
      cell: ({ row }) =>
        row.original.publishedAt ? (
          formatDate(row.original.publishedAt)
        ) : (
          <span className="text-muted-foreground">Not published</span>
        ),
      sortingFn: dateSort,
      meta: { label: "Published" },
    },
    {
      accessorKey: "updatedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => formatDate(row.original.updatedAt),
      sortingFn: dateSort,
      meta: { label: "Updated" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <SpotlightRowActions
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
          spotlight={row.original}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function SpotlightRowActions({
  spotlight,
  onDelete,
  onEdit,
  permissions,
}: {
  spotlight: SpotlightRow;
  onDelete: (spotlight: SpotlightRow) => void;
  onEdit: (spotlight: SpotlightRow) => void;
  permissions: SpotlightTablePermissions;
}) {
  const hasActions =
    permissions.canUpdate || permissions.canDelete || spotlight.photo;
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
            <DropdownMenuItem onSelect={() => onEdit(spotlight)}>
              <Edit3 className="size-4" />
              Edit spotlight
            </DropdownMenuItem>
          ) : null}
          {spotlight.photo ? (
            <DropdownMenuItem asChild>
              <a
                href={spotlight.photo.publicUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-4" />
                Open photo
              </a>
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(spotlight)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete spotlight
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SpotlightDialog({
  mode,
  onOpenChange,
  open,
  permissions,
  spotlight,
}: {
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  permissions: SpotlightTablePermissions;
  spotlight?: SpotlightRow;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New spotlight" : "Edit spotlight"}
          </DialogTitle>
          <DialogDescription>
            Published spotlights appear on the public site.
          </DialogDescription>
        </DialogHeader>
        <SpotlightForm
          mode={mode}
          onSaved={() => onOpenChange(false)}
          permissions={permissions}
          spotlight={spotlight}
        />
      </DialogContent>
    </Dialog>
  );
}

function SpotlightForm({
  mode,
  onSaved,
  permissions,
  spotlight,
}: {
  mode: "create" | "edit";
  onSaved: () => void;
  permissions: SpotlightTablePermissions;
  spotlight?: SpotlightRow;
}) {
  const [values, setValues] = React.useState<SpotlightFormValues>(() =>
    getInitialSpotlightFormValues(spotlight),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminSpotlight,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({
        queryKey: adminSpotlightsQueryKey,
      });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminSpotlight,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({
        queryKey: adminSpotlightsQueryKey,
      });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitSpotlight(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsedInput = createSpotlightInputSchema.safeParse({
      studentName: values.studentName,
      headline: values.headline,
      body: values.body,
      status: values.status,
      photoStorageObjectId: values.photo?.id ?? null,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ??
          "Check the spotlight details.",
      );
      return;
    }

    if (mode === "create") {
      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!spotlight) {
      toast.error("Spotlight not found.");
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      spotlightId: spotlight.id,
    });
  }

  function updateStatus(value: string): void {
    const parsedStatus = contentStatusSchema.safeParse(value);
    if (!parsedStatus.success) return;

    setValues((current) => ({
      ...current,
      status: parsedStatus.data,
    }));
  }

  return (
    <form className="space-y-5" onSubmit={submitSpotlight}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="spotlight-student-name">Student name</Label>
          <Input
            id="spotlight-student-name"
            maxLength={255}
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                studentName: changeEvent.currentTarget.value,
              }))
            }
            placeholder="Student name"
            value={values.studentName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spotlight-status">Status</Label>
          <Select onValueChange={updateStatus} value={values.status}>
            <SelectTrigger id="spotlight-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_STATUS_OPTIONS.map((option) => (
                <SelectItem
                  disabled={
                    option.value === "published" && !permissions.canPublish
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

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="spotlight-headline">Headline</Label>
          <Input
            id="spotlight-headline"
            maxLength={255}
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                headline: changeEvent.currentTarget.value,
              }))
            }
            placeholder="Clinical excellence award winner"
            value={values.headline}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="spotlight-body">Story</Label>
        <Textarea
          className="min-h-36"
          id="spotlight-body"
          maxLength={20_000}
          onChange={(changeEvent) =>
            setValues((current) => ({
              ...current,
              body: changeEvent.currentTarget.value,
            }))
          }
          placeholder="Write the spotlight story"
          value={values.body}
        />
      </div>

      <StorageUploadField
        disabled={isPending}
        endpoint="spotlightPhoto"
        label="Photo"
        onChange={(photo) =>
          setValues((current) => ({
            ...current,
            photo,
          }))
        }
        value={values.photo}
      />

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create spotlight" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteSpotlightDialog({
  isPending,
  onDelete,
  onOpenChange,
  spotlight,
}: {
  isPending: boolean;
  onDelete: (spotlightId: number) => void;
  onOpenChange: (open: boolean) => void;
  spotlight: SpotlightRow | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={spotlight !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete spotlight</DialogTitle>
          <DialogDescription>
            {spotlight
              ? `${spotlight.studentName}'s spotlight will be removed.`
              : "This spotlight will be removed."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!spotlight || isPending}
            onClick={() => {
              if (spotlight) onDelete(spotlight.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete spotlight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SpotlightStatusBadge({ status }: { status: ContentStatus }) {
  if (status === "published") {
    return <Badge>{CONTENT_STATUS_LABELS[status]}</Badge>;
  }

  if (status === "archived") {
    return (
      <Badge variant="secondary">
        <Archive className="size-3" />
        {CONTENT_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return <Badge variant="outline">{CONTENT_STATUS_LABELS[status]}</Badge>;
}

async function fetchAdminSpotlights() {
  const response = await fetch("/api/admin/spotlights", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load spotlights.",
    );
  }

  return adminSpotlightsResponseSchema.parse(body);
}

async function createAdminSpotlight(
  input: CreateSpotlightInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/spotlights", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Spotlight creation failed.");
}

async function updateAdminSpotlight(
  input: UpdateSpotlightInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/spotlights", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Spotlight update failed.");
}

async function deleteAdminSpotlight({
  spotlightId,
}: {
  spotlightId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/spotlights", {
    body: JSON.stringify({ spotlightId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Spotlight deletion failed.");
}

async function parseActionResponse(
  response: Response,
  fallback: string,
): Promise<ActionResult> {
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message || fallback);
  }

  return result;
}

function getInitialSpotlightFormValues(
  spotlight?: SpotlightRow,
): SpotlightFormValues {
  return {
    studentName: spotlight?.studentName ?? "",
    headline: spotlight?.headline ?? "",
    body: spotlight?.body ?? "",
    status: spotlight?.status ?? "draft",
    photo: spotlight?.photo
      ? {
          id: spotlight.photo.id,
          objectKey: spotlight.photo.objectKey,
          publicUrl: spotlight.photo.publicUrl,
        }
      : null,
  };
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
