"use client";

import * as React from "react";
import {
  Edit3,
  ExternalLink,
  Image as ImageIcon,
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
  GALLERY_ITEM_TYPE_LABELS,
  GALLERY_ITEM_TYPE_OPTIONS,
  adminGalleryResponseSchema,
  createGalleryItemInputSchema,
  galleryItemTypeSchema,
  type CreateGalleryItemInput,
  type GalleryItemRow,
  type GalleryItemType,
  type UpdateGalleryItemInput,
} from "@/modules/gallery/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { DataTablePageMeta } from "@/lib/data-table-query";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminGalleryQueryKey = ["admin-gallery"];

const featuredFilterOptions = [
  { label: "Featured", value: "featured" },
  { label: "Not featured", value: "not_featured" },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface GalleryFormValues {
  title: string;
  caption: string;
  type: GalleryItemType;
  image: UploadedStorageObject | null;
  isFeatured: boolean;
  capturedAt: string;
}

interface GalleryTableProps {
  initialGalleryItems: GalleryItemRow[];
  initialMeta: DataTablePageMeta;
  permissions: GalleryTablePermissions;
}

interface GalleryTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function GalleryTable({
  initialGalleryItems,
  initialMeta,
  permissions,
}: GalleryTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<GalleryItemRow | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = React.useState<GalleryItemRow | null>(
    null,
  );
  const queryClient = useQueryClient();
  const serverTable = useServerDataTable();
  const setPageMeta = serverTable.setPageMeta;

  const galleryQuery = useQuery({
    queryKey: [...adminGalleryQueryKey, serverTable.queryKey],
    queryFn: () => fetchAdminGallery(serverTable.searchParams),
    initialData: { galleryItems: initialGalleryItems, meta: initialMeta },
  });

  React.useEffect(() => {
    setPageMeta({
      pageCount: galleryQuery.data.meta.pageCount,
      totalRows: galleryQuery.data.meta.totalRows,
    });
  }, [
    galleryQuery.data.meta.pageCount,
    galleryQuery.data.meta.totalRows,
    setPageMeta,
  ]);

  const deleteMutation = useMutation({
    mutationFn: deleteAdminGalleryItem,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingItem(null);
      await queryClient.invalidateQueries({ queryKey: adminGalleryQueryKey });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingItem,
        onEdit: setEditingItem,
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
            Add image
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={galleryQuery.data.galleryItems}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <ImageIcon className="size-5" />
            </span>
            <p className="text-sm font-medium">No gallery images found</p>
            <p className="text-xs text-muted-foreground">
              Uploaded MELSSA photos will appear here.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "type",
            options: GALLERY_ITEM_TYPE_OPTIONS,
            title: "Type",
          },
          {
            columnId: "featuredStatus",
            options: featuredFilterOptions,
            title: "Featured",
          },
        ]}
        getRowId={(item) => String(item.id)}
        initialColumnVisibility={{ featuredStatus: false }}
        searchPlaceholder="Search gallery..."
        serverState={serverTable.state}
      />

      <GalleryDialog
        key="create-gallery-item"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      {editingItem && permissions.canUpdate ? (
        <GalleryDialog
          item={editingItem}
          key={`edit-${editingItem.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
          open
        />
      ) : null}

      <DeleteGalleryDialog
        isPending={deleteMutation.isPending}
        item={deletingItem}
        onDelete={(galleryItemId) => deleteMutation.mutate({ galleryItemId })}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
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
  onDelete: (item: GalleryItemRow) => void;
  onEdit: (item: GalleryItemRow) => void;
  permissions: GalleryTablePermissions;
}): ColumnDef<GalleryItemRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Image" />
      ),
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="min-w-64 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.title}</span>
              {item.isFeatured ? (
                <Badge>
                  <Sparkles className="size-3" />
                  Featured
                </Badge>
              ) : null}
            </div>
            {item.caption ? (
              <p className="max-w-xl truncate text-muted-foreground">
                {item.caption}
              </p>
            ) : null}
          </div>
        );
      },
      meta: { label: "Image", className: "min-w-64" },
    },
    {
      accessorKey: "type",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => GALLERY_ITEM_TYPE_LABELS[row.original.type],
      meta: { label: "Type" },
    },
    {
      id: "featuredStatus",
      accessorFn: (row) => (row.isFeatured ? "featured" : "not_featured"),
      filterFn: stringArrayFilter,
      header: "Featured Status",
      meta: { label: "Featured Status" },
    },
    {
      id: "file",
      accessorFn: (row) => row.image.originalFilename,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="File" />
      ),
      cell: ({ row }) => (
        <a
          className="inline-flex max-w-48 items-center gap-1 truncate text-sm underline-offset-4 hover:underline"
          href={row.original.image.publicUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-3.5" />
          {row.original.image.originalFilename}
        </a>
      ),
      meta: { label: "File", className: "min-w-44" },
    },
    {
      accessorKey: "capturedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Captured" />
      ),
      cell: ({ row }) =>
        row.original.capturedAt ? (
          formatDate(row.original.capturedAt)
        ) : (
          <span className="text-muted-foreground">Not set</span>
        ),
      sortingFn: dateSort,
      meta: { label: "Captured" },
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
        <GalleryRowActions
          item={row.original}
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function GalleryRowActions({
  item,
  onDelete,
  onEdit,
  permissions,
}: {
  item: GalleryItemRow;
  onDelete: (item: GalleryItemRow) => void;
  onEdit: (item: GalleryItemRow) => void;
  permissions: GalleryTablePermissions;
}) {
  const hasActions = permissions.canUpdate || permissions.canDelete;
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
        <DropdownMenuContent align="end" className="w-44">
          {permissions.canUpdate ? (
            <DropdownMenuItem onSelect={() => onEdit(item)}>
              <Edit3 className="size-4" />
              Edit image
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <a href={item.image.publicUrl} rel="noreferrer" target="_blank">
              <ExternalLink className="size-4" />
              Open image
            </a>
          </DropdownMenuItem>
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(item)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete image
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function GalleryDialog({
  item,
  mode,
  onOpenChange,
  open,
}: {
  item?: GalleryItemRow;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add gallery image" : "Edit gallery image"}
          </DialogTitle>
          <DialogDescription>
            Featured images are prioritized on public gallery surfaces.
          </DialogDescription>
        </DialogHeader>
        <GalleryForm item={item} mode={mode} onSaved={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function GalleryForm({
  item,
  mode,
  onSaved,
}: {
  item?: GalleryItemRow;
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<GalleryFormValues>(() =>
    getInitialGalleryFormValues(item),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminGalleryItem,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminGalleryQueryKey });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminGalleryItem,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminGalleryQueryKey });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitGalleryItem(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const parsedInput = createGalleryItemInputSchema.safeParse({
      title: values.title,
      caption: values.caption,
      type: values.type,
      storageObjectId: values.image?.id ?? "",
      isFeatured: values.isFeatured,
      capturedAt: values.capturedAt,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ??
          "Check the gallery image details.",
      );
      return;
    }

    if (mode === "create") {
      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!item) {
      toast.error("Gallery item not found.");
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      galleryItemId: item.id,
    });
  }

  function updateType(value: string): void {
    const parsedType = galleryItemTypeSchema.safeParse(value);
    if (!parsedType.success) return;

    setValues((current) => ({
      ...current,
      type: parsedType.data,
    }));
  }

  return (
    <form className="space-y-5" onSubmit={submitGalleryItem}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="gallery-title">Title</Label>
          <Input
            id="gallery-title"
            maxLength={255}
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                title: changeEvent.currentTarget.value,
              }))
            }
            placeholder="Congress outreach"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gallery-type">Type</Label>
          <Select onValueChange={updateType} value={values.type}>
            <SelectTrigger id="gallery-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GALLERY_ITEM_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gallery-captured-at">Captured date</Label>
          <Input
            id="gallery-captured-at"
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                capturedAt: changeEvent.currentTarget.value,
              }))
            }
            type="date"
            value={values.capturedAt}
          />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
        <input
          checked={values.isFeatured}
          className="mt-0.5 size-4 accent-primary"
          onChange={(changeEvent) =>
            setValues((current) => ({
              ...current,
              isFeatured: changeEvent.currentTarget.checked,
            }))
          }
          type="checkbox"
        />
        <span>
          <span className="block font-medium">Feature this image</span>
          <span className="text-muted-foreground">
            Featured images sort first in gallery collections.
          </span>
        </span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="gallery-caption">Caption</Label>
        <Textarea
          id="gallery-caption"
          maxLength={1_000}
          onChange={(changeEvent) =>
            setValues((current) => ({
              ...current,
              caption: changeEvent.currentTarget.value,
            }))
          }
          placeholder="Short context for this image"
          value={values.caption}
        />
      </div>

      <StorageUploadField
        disabled={isPending}
        endpoint="galleryImage"
        label="Image"
        onChange={(image) =>
          setValues((current) => ({
            ...current,
            image,
          }))
        }
        value={values.image}
      />

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create image" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteGalleryDialog({
  item,
  isPending,
  onDelete,
  onOpenChange,
}: {
  item: GalleryItemRow | null;
  isPending: boolean;
  onDelete: (galleryItemId: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={item !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete gallery image</DialogTitle>
          <DialogDescription>
            {item
              ? `${item.title} and its uploaded file will be removed.`
              : "This gallery image and its uploaded file will be removed."}
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
            disabled={!item || isPending}
            onClick={() => {
              if (item) onDelete(item.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function fetchAdminGallery(searchParams: string) {
  const url = searchParams
    ? `/api/admin/gallery?${searchParams}`
    : "/api/admin/gallery";
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load gallery.",
    );
  }

  return adminGalleryResponseSchema.parse(body);
}

async function createAdminGalleryItem(
  input: CreateGalleryItemInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/gallery", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Gallery creation failed.");
}

async function updateAdminGalleryItem(
  input: UpdateGalleryItemInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/gallery", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Gallery update failed.");
}

async function deleteAdminGalleryItem({
  galleryItemId,
}: {
  galleryItemId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/gallery", {
    body: JSON.stringify({ galleryItemId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Gallery deletion failed.");
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

function getInitialGalleryFormValues(item?: GalleryItemRow): GalleryFormValues {
  return {
    title: item?.title ?? "",
    caption: item?.caption ?? "",
    type: item?.type ?? "other",
    image: item
      ? {
          id: item.image.id,
          objectKey: item.image.objectKey,
          publicUrl: item.image.publicUrl,
        }
      : null,
    isFeatured: item?.isFeatured ?? false,
    capturedAt: toDateInputValue(item?.capturedAt ?? null),
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

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}
