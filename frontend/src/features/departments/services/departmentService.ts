import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import {
  CreateDepartmentPayload,
  Department,
  DepartmentDetail,
  PositionItem,
  UpdateDepartmentPayload,
} from "@/features/departments/types/department";

export async function getDepartments(params?: {
  keyword?: string;
  includeInactive?: boolean;
}): Promise<Department[]> {
  return apiGet<Department[]>(
    "/departments",
    params as Record<string, unknown>
  );
}

export async function getDepartmentById(id: string): Promise<DepartmentDetail> {
  return apiGet<DepartmentDetail>(`/departments/${id}`);
}

export async function createDepartment(
  payload: CreateDepartmentPayload
): Promise<Department> {
  return apiPost<Department>("/departments", payload);
}

export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentPayload
): Promise<Department> {
  return apiPut<Department>(`/departments/${id}`, payload);
}

export async function deleteDepartment(id: string): Promise<boolean> {
  return apiDelete<boolean>(`/departments/${id}`);
}

export async function getPositions(
  includeInactive = false
): Promise<PositionItem[]> {
  return apiGet<PositionItem[]>("/positions", { includeInactive });
}

