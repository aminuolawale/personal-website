export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePagination(searchParams: URLSearchParams, defaultPageSize: number, maxPageSize = 50) {
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const requestedPageSize = parsePositiveInt(searchParams.get("pageSize"), defaultPageSize);
  const pageSize = Math.min(requestedPageSize, maxPageSize);
  return { page, pageSize };
}

export function paginationMeta(page: number, pageSize: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    offset: (safePage - 1) * pageSize,
  };
}

export function paginatedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalItems: number,
): PaginatedResponse<T> {
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

export const EMPTY_PAGINATED_RESPONSE: PaginatedResponse<never> = {
  items: [],
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};
