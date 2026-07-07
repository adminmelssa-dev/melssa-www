"use client";

import * as React from "react";
import {
  History,
  TerminalSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useServerDataTable } from "@/components/data-table/use-server-data-table";
import { Badge } from "@/components/ui/badge";
import {
  adminAuditLogsResponseSchema,
  type AdminAuditLogsResponse,
  type AuditLogFilterOptions,
  type AuditLogRow,
  type AuditMetadata,
} from "@/modules/audit/contracts";
import { actionResultSchema } from "@/lib/action-result";
import type { DataTablePageMeta } from "@/lib/data-table-query";

const adminAuditLogsQueryKey = ["admin-audit-log"];

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

interface AuditTableProps {
  filterOptions: AuditLogFilterOptions;
  initialAuditLogs: AuditLogRow[];
  initialMeta: DataTablePageMeta;
}

export function AuditTable({
  filterOptions,
  initialAuditLogs,
  initialMeta,
}: AuditTableProps) {
  const serverTable = useServerDataTable({ initialPageSize: 20 });
  const setPageMeta = serverTable.setPageMeta;
  const auditQuery = useQuery({
    queryKey: [...adminAuditLogsQueryKey, serverTable.queryKey],
    queryFn: () => fetchAdminAuditLogs(serverTable.searchParams),
    initialData: { auditLogs: initialAuditLogs, meta: initialMeta },
  });

  React.useEffect(() => {
    setPageMeta({
      pageCount: auditQuery.data.meta.pageCount,
      totalRows: auditQuery.data.meta.totalRows,
    });
  }, [
    auditQuery.data.meta.pageCount,
    auditQuery.data.meta.totalRows,
    setPageMeta,
  ]);

  const columns = React.useMemo(() => getColumns(), []);
  const filters = React.useMemo(
    () => [
      {
        columnId: "entityType",
        options: filterOptions.entityTypes,
        title: "Entity",
      },
      {
        columnId: "action",
        options: filterOptions.actions,
        title: "Action",
      },
    ],
    [filterOptions],
  );

  return (
    <DataTable
      columns={columns}
      data={auditQuery.data.auditLogs}
      emptyState={
        <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
          <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <History className="size-5" />
          </span>
          <p className="text-sm font-medium">No audit entries found</p>
          <p className="text-xs text-muted-foreground">
            Administrative changes will appear here.
          </p>
        </div>
      }
      filters={filters}
      getRowId={(auditLog) => String(auditLog.id)}
      initialColumnVisibility={{ details: false }}
      initialPageSize={20}
      searchPlaceholder="Search audit log..."
      serverState={serverTable.state}
    />
  );
}

function getColumns(): ColumnDef<AuditLogRow>[] {
  return [
    {
      accessorKey: "createdAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {dateTimeFormatter.format(new Date(row.original.createdAt))}
        </span>
      ),
      sortingFn: dateSort,
      meta: { label: "Time", className: "min-w-40" },
    },
    {
      id: "actor",
      accessorFn: (row) => row.actor?.email ?? "system",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actor" />
      ),
      cell: ({ row }) =>
        row.original.actor ? (
          <div className="min-w-52">
            <p className="font-medium">{row.original.actor.name}</p>
            <p className="break-all text-muted-foreground">
              {row.original.actor.email}
            </p>
          </div>
        ) : (
          <div className="flex min-w-36 items-center gap-2 text-muted-foreground">
            <TerminalSquare className="size-4" />
            <span>System</span>
          </div>
        ),
      meta: { label: "Actor", className: "min-w-52" },
    },
    {
      accessorKey: "action",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) => <Badge variant="secondary">{row.original.action}</Badge>,
      meta: { label: "Action", className: "min-w-48" },
    },
    {
      accessorKey: "entityType",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entity" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{row.original.entityType}</Badge>
          {row.original.entityId ? (
            <span className="text-xs text-muted-foreground">
              #{row.original.entityId}
            </span>
          ) : null}
        </div>
      ),
      meta: { label: "Entity", className: "min-w-36" },
    },
    {
      accessorKey: "summary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Summary" />
      ),
      cell: ({ row }) => (
        <p className="max-w-xl whitespace-normal leading-6">
          {row.original.summary}
        </p>
      ),
      meta: { label: "Summary", className: "min-w-80" },
    },
    {
      id: "details",
      accessorFn: (row) => metadataToSearchText(row.metadata),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Details" />
      ),
      cell: ({ row }) => <MetadataBadges metadata={row.original.metadata} />,
      meta: { label: "Details", className: "min-w-72" },
    },
  ];
}

function MetadataBadges({ metadata }: { metadata: AuditMetadata }) {
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== "",
  );

  if (entries.length === 0) {
    return <span className="text-muted-foreground">None</span>;
  }

  return (
    <div className="flex max-w-md flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <Badge className="font-normal normal-case" key={key} variant="outline">
          {formatMetadataKey(key)}: {String(value)}
        </Badge>
      ))}
    </div>
  );
}

async function fetchAdminAuditLogs(
  searchParams: string,
): Promise<AdminAuditLogsResponse> {
  const url = searchParams
    ? `/api/admin/audit-log?${searchParams}`
    : "/api/admin/audit-log";
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load audit logs.",
    );
  }

  return adminAuditLogsResponseSchema.parse(body);
}

function metadataToSearchText(metadata: AuditMetadata): string {
  return Object.entries(metadata)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key} ${String(value)}`)
    .join(" ");
}

function formatMetadataKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replaceAll("_", " ").toLowerCase();
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
