"use client";

import { useCallback, useEffect, useState } from "react";
import { PagedResult } from "@/types/api";
import {
  EmployeeFilterParams,
  EmployeeSummary,
} from "@/features/employees/types/employee";
import { getEmployees } from "@/features/employees/services/employeeService";

interface UseEmployeesReturn {
  data: PagedResult<EmployeeSummary> | null;
  employees: EmployeeSummary[];
  isLoading: boolean;
  error: string | null;
  filters: EmployeeFilterParams;
  updateFilters: (partial: Partial<EmployeeFilterParams>) => void;
  resetFilters: () => void;
  refresh: () => Promise<void>;
}

const DEFAULT_FILTERS: EmployeeFilterParams = {
  keyword: "",
  status: "",
  pageNumber: 1,
  pageSize: 10,
  sortBy: "EmployeeCode",
  sortOrder: "asc",
};

export function useEmployees(
  initialFilters: Partial<EmployeeFilterParams> = {}
): UseEmployeesReturn {
  const [filters, setFilters] = useState<EmployeeFilterParams>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [data, setData] = useState<PagedResult<EmployeeSummary> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getEmployees(filters);
      setData(result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách thành viên đội ngũ. Vui lòng kiểm tra kết nối tới máy chủ API.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const updateFilters = useCallback(
    (partial: Partial<EmployeeFilterParams>) => {
      setFilters((prev) => {
        const isPageChangeOnly =
          Object.keys(partial).length === 1 && "pageNumber" in partial;
        return {
          ...prev,
          ...partial,
          pageNumber: isPageChangeOnly ? partial.pageNumber ?? 1 : 1,
        };
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    data,
    employees: data?.items ?? [],
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh: fetchList,
  };
}

