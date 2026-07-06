"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  DataTableToolbar,
  type DataTableFilterConfig,
} from "@/components/data-table/data-table-toolbar";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    label?: string;
    className?: string;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  searchPlaceholder?: string;
  filters?: DataTableFilterConfig[];
  bulkActions?: (table: TanstackTable<TData>) => React.ReactNode;
  emptyState?: React.ReactNode;
  initialPageSize?: number;
  initialColumnVisibility?: VisibilityState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  searchPlaceholder,
  filters,
  bulkActions,
  emptyState,
  initialPageSize = 10,
  initialColumnVisibility,
}: DataTableProps<TData, TValue>) {
  "use no memo";

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility ?? {});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageSize: initialPageSize } },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
      sorting,
    },
  });

  return (
    <div className="space-y-3">
      <DataTableToolbar
        bulkActions={bulkActions}
        filters={filters}
        searchPlaceholder={searchPlaceholder}
        table={table}
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                className="bg-muted/40 hover:bg-muted/40"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={cn(header.column.columnDef.meta?.className)}
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className={cn(cell.column.columnDef.meta?.className)}
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  className="p-0"
                  colSpan={table.getVisibleLeafColumns().length}
                >
                  {emptyState ?? (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                      No results.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
