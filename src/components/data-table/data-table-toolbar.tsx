"use client";

import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "@/components/data-table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

export interface DataTableFilterConfig {
  columnId: string;
  title: string;
  options: FacetedFilterOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  filters?: DataTableFilterConfig[];
  bulkActions?: (table: Table<TData>) => ReactNode;
  showFacetedCounts?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Search...",
  filters = [],
  bulkActions,
  showFacetedCounts = true,
}: DataTableToolbarProps<TData>) {
  const globalFilter =
    typeof table.getState().globalFilter === "string"
      ? table.getState().globalFilter
      : "";
  const isFiltered =
    table.getState().columnFilters.length > 0 || globalFilter !== "";
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search"
            className="h-9 pl-9"
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            value={globalFilter}
          />
        </div>

        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId);

          return column ? (
            <DataTableFacetedFilter
              column={column}
              key={filter.columnId}
              options={filter.options}
              showCounts={showFacetedCounts}
              title={filter.title}
            />
          ) : null;
        })}

        {isFiltered ? (
          <Button
            className="h-9 px-2"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            size="sm"
            variant="ghost"
          >
            Reset
            <X className="size-4" />
          </Button>
        ) : null}

        <div className="ml-auto">
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {selectedCount > 0 && bulkActions ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <Separator className="h-5" orientation="vertical" />
          {bulkActions(table)}
          <Button
            className="ml-auto h-8"
            onClick={() => table.resetRowSelection()}
            size="sm"
            variant="ghost"
          >
            Clear selection
          </Button>
        </div>
      ) : null}
    </div>
  );
}
