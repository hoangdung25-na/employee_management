import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import { PagedResult } from "@/types/api";
import { PermissionModuleGroup } from "@/features/auth/types/permissions";
import {
  CreateUserPayload,
  GetUsersParams,
  RoleOption,
  UnlinkedEmployeeOption,
  UpdateUserPayload,
  UserSummary,
} from "@/features/users/types/user";

export async function getUsersApi(
  params?: GetUsersParams
): Promise<PagedResult<UserSummary>> {
  return apiGet<PagedResult<UserSummary>>(
    "/users",
    params as Record<string, unknown>
  );
}

export async function getRoleOptionsApi(): Promise<RoleOption[]> {
  return apiGet<RoleOption[]>("/users/roles");
}

export async function getPermissionTreeApi(): Promise<PermissionModuleGroup[]> {
  return apiGet<PermissionModuleGroup[]>("/auth/permissions-tree");
}

export async function getUnlinkedEmployeesApi(
  includeEmployeeId?: string | null
): Promise<UnlinkedEmployeeOption[]> {
  return apiGet<UnlinkedEmployeeOption[]>("/users/unlinked-employees", {
    includeEmployeeId: includeEmployeeId || undefined,
  });
}

export async function createUserApi(
  payload: CreateUserPayload
): Promise<UserSummary> {
  return apiPost<UserSummary>("/users", payload);
}

export async function updateUserApi(
  id: string,
  payload: UpdateUserPayload
): Promise<UserSummary> {
  return apiPut<UserSummary>(`/users/${id}`, payload);
}

export async function toggleUserStatusApi(
  id: string,
  isActive: boolean
): Promise<boolean> {
  return apiPatch<boolean>(`/users/${id}/status`, { isActive });
}
