"use client";

import * as React from "react";
import {
  Archive,
  Bell,
  Edit3,
  ExternalLink,
  MoreHorizontal,
  Plus,
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
import { useServerDataTable } from "@/components/data-table/use-server-data-table";
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
  ANNOUNCEMENT_CATEGORY_LABELS,
  ANNOUNCEMENT_CATEGORY_OPTIONS,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  adminAnnouncementsResponseSchema,
  announcementCategorySchema,
  createAnnouncementInputSchema,
  contentStatusSchema,
  type AnnouncementCategory,
  type AnnouncementRow,
  type ContentStatus,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
} from "@/modules/announcements/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { DataTablePageMeta } from "@/lib/data-table-query";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminAnnouncementsQueryKey = ["admin-announcements"];

const attachmentFilterOptions = [
  { label: "Has attachment", value: "has_attachment" },
  { label: "No attachment", value: "no_attachment" },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface AnnouncementFormValues {
  title: string;
  summary: string;
  body: string;
  category: AnnouncementCategory;
  status: ContentStatus;
  attachment: UploadedStorageObject | null;
}

interface AnnouncementsTableProps {
  initialAnnouncements: AnnouncementRow[];
  initialMeta: DataTablePageMeta;
  permissions: AnnouncementTablePermissions;
}

interface AnnouncementTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export function AnnouncementsTable({
  initialAnnouncements,
  initialMeta,
  permissions,
}: AnnouncementsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    React.useState<AnnouncementRow | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] =
    React.useState<AnnouncementRow | null>(null);
  const queryClient = useQueryClient();
  const serverTable = useServerDataTable();
  const setPageMeta = serverTable.setPageMeta;

  const announcementsQuery = useQuery({
    queryKey: [...adminAnnouncementsQueryKey, serverTable.queryKey],
    queryFn: () => fetchAdminAnnouncements(serverTable.searchParams),
    initialData: { announcements: initialAnnouncements, meta: initialMeta },
  });

  React.useEffect(() => {
    setPageMeta({
      pageCount: announcementsQuery.data.meta.pageCount,
      totalRows: announcementsQuery.data.meta.totalRows,
    });
  }, [
    announcementsQuery.data.meta.pageCount,
    announcementsQuery.data.meta.totalRows,
    setPageMeta,
  ]);

  const deleteMutation = useMutation({
    mutationFn: deleteAdminAnnouncement,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingAnnouncement(null);
      await queryClient.invalidateQueries({
        queryKey: adminAnnouncementsQueryKey,
      });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingAnnouncement,
        onEdit: setEditingAnnouncement,
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
            New announcement
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={announcementsQuery.data.announcements}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <Bell className="size-5" />
            </span>
            <p className="text-sm font-medium">No announcements found</p>
            <p className="text-xs text-muted-foreground">
              Published updates will appear on the public site.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "category",
            options: ANNOUNCEMENT_CATEGORY_OPTIONS,
            title: "Category",
          },
          {
            columnId: "status",
            options: CONTENT_STATUS_OPTIONS,
            title: "Status",
          },
          {
            columnId: "attachmentStatus",
            options: attachmentFilterOptions,
            title: "Attachment",
          },
        ]}
        getRowId={(announcement) => String(announcement.id)}
        initialColumnVisibility={{ attachmentStatus: false }}
        searchPlaceholder="Search announcements..."
        serverState={serverTable.state}
      />

      <AnnouncementDialog
        key="create-announcement"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
        permissions={permissions}
      />

      {editingAnnouncement && permissions.canUpdate ? (
        <AnnouncementDialog
          announcement={editingAnnouncement}
          key={`edit-${editingAnnouncement.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingAnnouncement(null);
          }}
          open
          permissions={permissions}
        />
      ) : null}

      <DeleteAnnouncementDialog
        announcement={deletingAnnouncement}
        isPending={deleteMutation.isPending}
        onDelete={(announcementId) =>
          deleteMutation.mutate({ announcementId })
        }
        onOpenChange={(open) => {
          if (!open) setDeletingAnnouncement(null);
        }}
      />
    </section>
  );
}

function getColumns({
  onDelete,
  onEdit,
  permissions,
}: {
  onDelete: (announcement: AnnouncementRow) => void;
  onEdit: (announcement: AnnouncementRow) => void;
  permissions: AnnouncementTablePermissions;
}): ColumnDef<AnnouncementRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Announcement" />
      ),
      cell: ({ row }) => {
        const announcement = row.original;

        return (
          <div className="min-w-72 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{announcement.title}</span>
              <AnnouncementStatusBadge status={announcement.status} />
            </div>
            {announcement.summary ? (
              <p className="max-w-xl truncate text-muted-foreground">
                {announcement.summary}
              </p>
            ) : null}
          </div>
        );
      },
      meta: { label: "Announcement", className: "min-w-72" },
    },
    {
      accessorKey: "category",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => ANNOUNCEMENT_CATEGORY_LABELS[row.original.category],
      meta: { label: "Category" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <AnnouncementStatusBadge status={row.original.status} />
      ),
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
            className="inline-flex max-w-56 items-center gap-1 truncate text-sm underline-offset-4 hover:underline"
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
      meta: { label: "Attachment", className: "min-w-48" },
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
      accessorKey: "publishedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Published" />
      ),
      cell: ({ row }) => formatDate(row.original.publishedAt),
      sortingFn: nullableDateSort,
      meta: { label: "Published" },
    },
    {
      accessorKey: "updatedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => formatDate(row.original.updatedAt),
      sortingFn: nullableDateSort,
      meta: { label: "Updated" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <AnnouncementRowActions
          announcement={row.original}
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function AnnouncementRowActions({
  announcement,
  onDelete,
  onEdit,
  permissions,
}: {
  announcement: AnnouncementRow;
  onDelete: (announcement: AnnouncementRow) => void;
  onEdit: (announcement: AnnouncementRow) => void;
  permissions: AnnouncementTablePermissions;
}) {
  const hasActions =
    permissions.canUpdate || permissions.canDelete || announcement.attachment;
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
        <DropdownMenuContent align="end" className="w-52">
          {permissions.canUpdate ? (
            <DropdownMenuItem onSelect={() => onEdit(announcement)}>
              <Edit3 className="size-4" />
              Edit announcement
            </DropdownMenuItem>
          ) : null}
          {announcement.attachment ? (
            <DropdownMenuItem asChild>
              <a
                href={announcement.attachment.publicUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-4" />
                Open attachment
              </a>
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(announcement)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete announcement
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AnnouncementDialog({
  announcement,
  mode,
  onOpenChange,
  open,
  permissions,
}: {
  announcement?: AnnouncementRow;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  permissions: AnnouncementTablePermissions;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New announcement" : "Edit announcement"}
          </DialogTitle>
          <DialogDescription>
            Published announcements appear on the public site.
          </DialogDescription>
        </DialogHeader>
        <AnnouncementForm
          announcement={announcement}
          mode={mode}
          onSaved={() => onOpenChange(false)}
          permissions={permissions}
        />
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementForm({
  announcement,
  mode,
  onSaved,
  permissions,
}: {
  announcement?: AnnouncementRow;
  mode: "create" | "edit";
  onSaved: () => void;
  permissions: AnnouncementTablePermissions;
}) {
  const [values, setValues] = React.useState<AnnouncementFormValues>(() =>
    getInitialAnnouncementFormValues(announcement),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminAnnouncement,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({
        queryKey: adminAnnouncementsQueryKey,
      });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminAnnouncement,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({
        queryKey: adminAnnouncementsQueryKey,
      });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitAnnouncement(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsedInput = createAnnouncementInputSchema.safeParse({
      title: values.title,
      summary: values.summary,
      body: values.body,
      category: values.category,
      status: values.status,
      attachmentStorageObjectId: values.attachment?.id ?? null,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ??
          "Check the announcement details.",
      );
      return;
    }

    if (mode === "create") {
      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!announcement) {
      toast.error("Announcement not found.");
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      announcementId: announcement.id,
    });
  }

  function updateCategory(value: string): void {
    const parsedCategory = announcementCategorySchema.safeParse(value);
    if (!parsedCategory.success) return;

    setValues((current) => ({
      ...current,
      category: parsedCategory.data,
    }));
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
    <form className="space-y-5" onSubmit={submitAnnouncement}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="announcement-title">Title</Label>
          <Input
            id="announcement-title"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                title: event.currentTarget.value,
              }))
            }
            placeholder="Association meeting update"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-category">Category</Label>
          <Select onValueChange={updateCategory} value={values.category}>
            <SelectTrigger id="announcement-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-status">Status</Label>
          <Select onValueChange={updateStatus} value={values.status}>
            <SelectTrigger id="announcement-status">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="announcement-summary">Summary</Label>
        <Textarea
          id="announcement-summary"
          maxLength={500}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              summary: event.currentTarget.value,
            }))
          }
          placeholder="Short preview for cards and lists"
          value={values.summary}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="announcement-body">Body</Label>
        <Textarea
          className="min-h-36"
          id="announcement-body"
          maxLength={20_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              body: event.currentTarget.value,
            }))
          }
          placeholder="Write the full announcement"
          value={values.body}
        />
      </div>

      <StorageUploadField
        disabled={isPending}
        endpoint="announcementAttachment"
        label="Attachment"
        onChange={(attachment) =>
          setValues((current) => ({
            ...current,
            attachment,
          }))
        }
        value={values.attachment}
      />

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create announcement" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteAnnouncementDialog({
  announcement,
  isPending,
  onDelete,
  onOpenChange,
}: {
  announcement: AnnouncementRow | null;
  isPending: boolean;
  onDelete: (announcementId: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={announcement !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete announcement</DialogTitle>
          <DialogDescription>
            {announcement
              ? `${announcement.title} will be removed from the announcement archive.`
              : "This announcement will be removed from the announcement archive."}
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
            disabled={!announcement || isPending}
            onClick={() => {
              if (announcement) onDelete(announcement.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementStatusBadge({ status }: { status: ContentStatus }) {
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

async function fetchAdminAnnouncements(searchParams: string) {
  const url = searchParams
    ? `/api/admin/announcements?${searchParams}`
    : "/api/admin/announcements";
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load announcements.",
    );
  }

  return adminAnnouncementsResponseSchema.parse(body);
}

async function createAdminAnnouncement(
  input: CreateAnnouncementInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/announcements", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Announcement creation failed.");
}

async function updateAdminAnnouncement(
  input: UpdateAnnouncementInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/announcements", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Announcement update failed.");
}

async function deleteAdminAnnouncement({
  announcementId,
}: {
  announcementId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/announcements", {
    body: JSON.stringify({ announcementId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Announcement deletion failed.");
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

function getInitialAnnouncementFormValues(
  announcement?: AnnouncementRow,
): AnnouncementFormValues {
  return {
    title: announcement?.title ?? "",
    summary: announcement?.summary ?? "",
    body: announcement?.body ?? "",
    category: announcement?.category ?? "general",
    status: announcement?.status ?? "draft",
    attachment: announcement?.attachment
      ? {
          id: announcement.attachment.id,
          objectKey: announcement.attachment.objectKey,
          publicUrl: announcement.attachment.publicUrl,
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
  return value ? dateFormatter.format(new Date(value)) : "Not published";
}
