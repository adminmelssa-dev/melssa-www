"use client";

import * as React from "react";
import {
  ExternalLink,
  FileArchive,
  HardDrive,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  STORAGE_ENDPOINT_LABELS,
  STORAGE_ENDPOINT_OPTIONS,
  STORAGE_OBJECT_STATUS_LABELS,
  STORAGE_OBJECT_STATUS_OPTIONS,
  STORAGE_PROVIDER_LABELS,
  adminStorageResponseSchema,
  type StorageObjectRow,
  type StorageObjectStatus,
} from "@/modules/storage/contracts";
import {
  actionResultSchema,
} from "@/lib/action-result";
import { formatBytes } from "@/lib/format-bytes";

const adminStorageQueryKey = ["admin-storage"];

const providerFilterOptions = [{ label: "UploadThing", value: "uploadthing" }];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface StorageTableProps {
  initialStorageObjects: StorageObjectRow[];
}

export function StorageTable({ initialStorageObjects }: StorageTableProps) {
  const storageQuery = useQuery({
    queryKey: adminStorageQueryKey,
    queryFn: fetchAdminStorage,
    initialData: { storageObjects: initialStorageObjects },
  });

  const columns = React.useMemo(() => getColumns(), []);

  return (
    <DataTable
      columns={columns}
      data={storageQuery.data.storageObjects}
      emptyState={
        <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
          <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <HardDrive className="size-5" />
          </span>
          <p className="text-sm font-medium">No storage objects found</p>
          <p className="text-xs text-muted-foreground">
            Completed uploads will appear here.
          </p>
        </div>
      }
      filters={[
        {
          columnId: "endpoint",
          options: STORAGE_ENDPOINT_OPTIONS,
          title: "Endpoint",
        },
        {
          columnId: "status",
          options: STORAGE_OBJECT_STATUS_OPTIONS,
          title: "Status",
        },
        {
          columnId: "provider",
          options: providerFilterOptions,
          title: "Provider",
        },
      ]}
      getRowId={(object) => object.id}
      searchPlaceholder="Search storage..."
    />
  );
}

function getColumns(): ColumnDef<StorageObjectRow>[] {
  return [
    {
      accessorKey: "originalFilename",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="File" />
      ),
      cell: ({ row }) => {
        const object = row.original;

        return (
          <div className="min-w-72 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{object.originalFilename}</span>
              <StorageStatusBadge status={object.status} />
            </div>
            <p className="max-w-xl truncate text-muted-foreground">
              {object.objectKey}
            </p>
          </div>
        );
      },
      meta: { label: "File", className: "min-w-72" },
    },
    {
      accessorKey: "endpoint",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Endpoint" />
      ),
      cell: ({ row }) => STORAGE_ENDPOINT_LABELS[row.original.endpoint],
      meta: { label: "Endpoint", className: "min-w-44" },
    },
    {
      accessorKey: "provider",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Provider" />
      ),
      cell: ({ row }) => STORAGE_PROVIDER_LABELS[row.original.provider],
      meta: { label: "Provider" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StorageStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      accessorKey: "byteSize",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
      cell: ({ row }) => formatBytes(row.original.byteSize),
      meta: { label: "Size" },
    },
    {
      id: "uploader",
      accessorFn: (row) => row.uploadedBy?.email ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Uploader" />
      ),
      cell: ({ row }) =>
        row.original.uploadedBy ? (
          <div className="min-w-48">
            <p className="font-medium">{row.original.uploadedBy.name}</p>
            <p className="break-all text-muted-foreground">
              {row.original.uploadedBy.email}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">Unknown</span>
        ),
      meta: { label: "Uploader", className: "min-w-48" },
    },
    {
      accessorKey: "completedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Completed" />
      ),
      cell: ({ row }) => formatNullableDate(row.original.completedAt),
      sortingFn: nullableDateSort,
      meta: { label: "Completed" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild className="size-8" size="icon" variant="ghost">
            <a href={row.original.publicUrl} rel="noreferrer" target="_blank">
              <ExternalLink className="size-4" />
              <span className="sr-only">Open file</span>
            </a>
          </Button>
        </div>
      ),
      meta: { className: "w-12" },
    },
  ];
}

function StorageStatusBadge({ status }: { status: StorageObjectStatus }) {
  if (status === "completed") {
    return <Badge>{STORAGE_OBJECT_STATUS_LABELS[status]}</Badge>;
  }

  return (
    <Badge variant="secondary">
      <FileArchive className="size-3" />
      {STORAGE_OBJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

async function fetchAdminStorage() {
  const response = await fetch("/api/admin/storage", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load storage objects.",
    );
  }

  return adminStorageResponseSchema.parse(body);
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
  return dateValue(first.getValue(columnId)) - dateValue(second.getValue(columnId));
}

function dateValue(value: unknown): number {
  return typeof value === "string" ? new Date(value).getTime() : 0;
}

function formatNullableDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Not completed";
}
