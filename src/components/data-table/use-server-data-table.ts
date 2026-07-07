"use client";

import * as React from "react";
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import {
  createDataTableSearchParams,
  DATA_TABLE_DEFAULT_PAGE_SIZE,
  serializeDataTableQuery,
  type DataTableFilterQuery,
  type DataTableQuery,
} from "@/lib/data-table-query";

interface UseServerDataTableOptions {
  initialPageSize?: number;
  searchDebounceMs?: number;
}

export interface ServerDataTableState {
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  onGlobalFilterChange: OnChangeFn<string>;
  onPaginationChange: OnChangeFn<PaginationState>;
  onSortingChange: OnChangeFn<SortingState>;
  pageCount: number;
  pagination: PaginationState;
  rowCount: number;
  sorting: SortingState;
}

export interface ServerDataTableController {
  query: DataTableQuery;
  queryKey: string;
  searchParams: string;
  state: ServerDataTableState;
  setPageMeta: (meta: { pageCount: number; totalRows: number }) => void;
}

export function useServerDataTable({
  initialPageSize = DATA_TABLE_DEFAULT_PAGE_SIZE,
  searchDebounceMs = 300,
}: UseServerDataTableOptions = {}): ServerDataTableController {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pageMeta, setPageMeta] = React.useState({
    pageCount: 1,
    totalRows: 0,
  });
  const debouncedGlobalFilter = useDebouncedValue(
    globalFilter,
    searchDebounceMs,
  );

  const query = React.useMemo<DataTableQuery>(() => {
    const firstSort = sorting[0];

    return {
      filters: columnFilters.flatMap(toFilterQuery),
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search: debouncedGlobalFilter.trim(),
      sortBy: firstSort?.id ?? null,
      sortDirection: firstSort ? (firstSort.desc ? "desc" : "asc") : null,
    };
  }, [
    columnFilters,
    debouncedGlobalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ]);

  const searchParams = React.useMemo(
    () => createDataTableSearchParams(query).toString(),
    [query],
  );
  const queryKey = React.useMemo(() => serializeDataTableQuery(query), [query]);

  const resetToFirstPage = React.useCallback(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    );
  }, []);

  const onPaginationChange = React.useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      setPagination((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [],
  );

  const onSortingChange = React.useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      setSorting((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
      resetToFirstPage();
    },
    [resetToFirstPage],
  );

  const onColumnFiltersChange = React.useCallback<
    OnChangeFn<ColumnFiltersState>
  >(
    (updater) => {
      setColumnFilters((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
      resetToFirstPage();
    },
    [resetToFirstPage],
  );

  const onGlobalFilterChange = React.useCallback<OnChangeFn<string>>(
    (updater) => {
      setGlobalFilter((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
      resetToFirstPage();
    },
    [resetToFirstPage],
  );

  return {
    query,
    queryKey,
    searchParams,
    setPageMeta,
    state: {
      columnFilters,
      globalFilter,
      onColumnFiltersChange,
      onGlobalFilterChange,
      onPaginationChange,
      onSortingChange,
      pageCount: pageMeta.pageCount,
      pagination,
      rowCount: pageMeta.totalRows,
      sorting,
    },
  };
}

function useDebouncedValue<TValue>(value: TValue, delayMs: number): TValue {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}

function toFilterQuery(filter: ColumnFiltersState[number]): DataTableFilterQuery[] {
  if (!Array.isArray(filter.value)) return [];

  const values = filter.value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim() !== "",
  );

  if (values.length === 0) return [];
  return [{ id: filter.id, values }];
}
