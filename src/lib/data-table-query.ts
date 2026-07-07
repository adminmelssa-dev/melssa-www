import { z } from "zod";

export const DATA_TABLE_DEFAULT_PAGE_SIZE = 10;
export const DATA_TABLE_MAX_PAGE_SIZE = 100;

export const dataTablePageMetaSchema = z.object({
  pageIndex: z.number().int().min(0),
  pageSize: z.number().int().min(1).max(DATA_TABLE_MAX_PAGE_SIZE),
  totalRows: z.number().int().min(0),
  pageCount: z.number().int().min(1),
});

export type DataTablePageMeta = z.infer<typeof dataTablePageMetaSchema>;

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableFilterQuery {
  id: string;
  values: string[];
}

export interface DataTableQuery {
  pageIndex: number;
  pageSize: number;
  search: string;
  sortBy: string | null;
  sortDirection: DataTableSortDirection | null;
  filters: DataTableFilterQuery[];
}

export interface DataTablePage<TItem> {
  items: TItem[];
  meta: DataTablePageMeta;
}

export interface ParseDataTableQueryOptions {
  defaultPageSize?: number;
}

export function parseDataTableQuery(
  searchParams: URLSearchParams,
  options: ParseDataTableQueryOptions = {},
): DataTableQuery {
  const defaultPageSize =
    options.defaultPageSize ?? DATA_TABLE_DEFAULT_PAGE_SIZE;
  const pageSize = clampPageSize(
    parseInteger(searchParams.get("pageSize")) ?? defaultPageSize,
  );
  const page = Math.max(parseInteger(searchParams.get("page")) ?? 1, 1);
  const sortBy = normalizeOptionalParam(searchParams.get("sort"));
  const directionParam = normalizeOptionalParam(searchParams.get("direction"));
  const sortDirection =
    directionParam === "asc" || directionParam === "desc"
      ? directionParam
      : sortBy
        ? "asc"
        : null;

  return {
    filters: parseFilterParams(searchParams),
    pageIndex: page - 1,
    pageSize,
    search: normalizeSearch(searchParams.get("search")),
    sortBy,
    sortDirection,
  };
}

export function createDataTableSearchParams(
  query: DataTableQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(query.pageIndex + 1));
  params.set("pageSize", String(query.pageSize));

  if (query.search) params.set("search", query.search);

  if (query.sortBy && query.sortDirection) {
    params.set("sort", query.sortBy);
    params.set("direction", query.sortDirection);
  }

  for (const filter of query.filters) {
    const uniqueValues = Array.from(new Set(filter.values)).sort();
    for (const value of uniqueValues) {
      params.append(`filter.${filter.id}`, value);
    }
  }

  return params;
}

export function serializeDataTableQuery(query: DataTableQuery): string {
  return createDataTableSearchParams(query).toString();
}

export function createDataTablePage<TItem>({
  items,
  query,
  totalRows,
}: {
  items: TItem[];
  query: DataTableQuery;
  totalRows: number;
}): DataTablePage<TItem> {
  return {
    items,
    meta: {
      pageCount: Math.max(1, Math.ceil(totalRows / query.pageSize)),
      pageIndex: query.pageIndex,
      pageSize: query.pageSize,
      totalRows,
    },
  };
}

export function getDataTableOffset(query: DataTableQuery): number {
  return query.pageIndex * query.pageSize;
}

export function getDataTableFilterValues(
  query: DataTableQuery,
  filterId: string,
): string[] {
  return query.filters.find((filter) => filter.id === filterId)?.values ?? [];
}

export function createInitialDataTableMeta({
  pageSize = DATA_TABLE_DEFAULT_PAGE_SIZE,
  totalRows,
}: {
  pageSize?: number;
  totalRows: number;
}): DataTablePageMeta {
  return {
    pageCount: Math.max(1, Math.ceil(totalRows / pageSize)),
    pageIndex: 0,
    pageSize,
    totalRows,
  };
}

function parseFilterParams(searchParams: URLSearchParams): DataTableFilterQuery[] {
  const valuesByFilterId = new Map<string, string[]>();

  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith("filter.")) continue;

    const filterId = key.slice("filter.".length).trim();
    const normalizedValue = value.trim();
    if (!filterId || !normalizedValue) continue;

    const currentValues = valuesByFilterId.get(filterId);
    if (currentValues) {
      currentValues.push(normalizedValue);
    } else {
      valuesByFilterId.set(filterId, [normalizedValue]);
    }
  }

  return Array.from(valuesByFilterId.entries())
    .map(([id, values]) => ({ id, values: Array.from(new Set(values)).sort() }))
    .sort((first, second) => first.id.localeCompare(second.id));
}

function parseInteger(value: string | null): number | null {
  if (!value) return null;
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function clampPageSize(value: number): number {
  return Math.min(Math.max(value, 1), DATA_TABLE_MAX_PAGE_SIZE);
}

function normalizeOptionalParam(value: string | null): string | null {
  if (!value) return null;
  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function normalizeSearch(value: string | null): string {
  return value?.trim() ?? "";
}
