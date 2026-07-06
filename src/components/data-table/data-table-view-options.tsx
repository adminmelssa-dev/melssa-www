"use client";

import { SlidersHorizontal } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const hideableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide(),
    );

  if (hideableColumns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9" size="sm" variant="outline">
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">View</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            checked={column.getIsVisible()}
            className="capitalize"
            key={column.id}
            onCheckedChange={(value) => column.toggleVisibility(value === true)}
          >
            {column.columnDef.meta?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
