"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col-reverse items-center gap-4 px-1 sm:flex-row sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {selectedCount > 0
          ? `${selectedCount} of ${totalCount} row(s) selected.`
          : `${totalCount} row(s).`}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
            value={`${table.getState().pagination.pageSize}`}
          >
            <SelectTrigger aria-label="Rows per page" className="w-[72px]" size="sm">
              <SelectValue
                placeholder={`${table.getState().pagination.pageSize}`}
              />
            </SelectTrigger>
            <SelectContent side="top">
            {pageSizeOptions.map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-28 items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="First page"
            className="hidden size-8 lg:flex"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            size="icon"
            variant="outline"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            aria-label="Previous page"
            className="size-8"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            aria-label="Next page"
            className="size-8"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            aria-label="Last page"
            className="hidden size-8 lg:flex"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            size="icon"
            variant="outline"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
