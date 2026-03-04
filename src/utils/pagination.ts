
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginationMeta(
  total: number,
  params: PaginationParams
): PaginationMeta {
  const totalPages = Math.ceil(total / params.pageSize);

  return {
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

export function parsePaginationParams(
  page?: string | number,
  pageSize?: string | number
): PaginationParams {
  const parsedPage = Math.max(1, parseInt(String(page || "1"), 10) || 1);
  const parsedPageSize = Math.min(
    100, // max page size cap
    Math.max(1, parseInt(String(pageSize || "20"), 10) || 20)
  );

  return { page: parsedPage, pageSize: parsedPageSize };
}
