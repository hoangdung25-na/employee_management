/**
 * Unified API Response Wrapper matching Backend `ApiResponse<T>`.
 * Golden Rule #9: Every endpoint returns `ApiResponse<T>` or `PagedResult<T>`.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[] | null;
}

/**
 * Standardized Paginated Response Wrapper matching Backend `PagedResult<T>`.
 */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

