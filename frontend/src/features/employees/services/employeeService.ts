import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import { PagedResult } from "@/types/api";
import {
  CreateEmployeePayload,
  EmployeeDetail,
  EmployeeFilterParams,
  EmployeeSummary,
  TerminateEmployeePayload,
  UpdateEmployeePayload,
} from "@/features/employees/types/employee";

/**
 * Gọi endpoint `GET /api/employees` lấy danh sách Thành viên Đội ngũ có phân trang & bộ lọc.
 */
export async function getEmployees(
  params?: EmployeeFilterParams
): Promise<PagedResult<EmployeeSummary>> {
  return apiGet<PagedResult<EmployeeSummary>>(
    "/employees",
    params as Record<string, unknown>
  );
}

/**
 * Gọi endpoint `GET /api/employees/{id:guid}` lấy hồ sơ chi tiết của 1 thành viên.
 */
export async function getEmployeeById(id: string): Promise<EmployeeDetail> {
  return apiGet<EmployeeDetail>(`/employees/${id}`);
}

/**
 * Gọi endpoint `POST /api/employees` tiếp nhận thành viên mới (tự động cấp mã `EMP-xxxxx`).
 */
export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<EmployeeDetail> {
  return apiPost<EmployeeDetail>("/employees", payload);
}

/**
 * Gọi endpoint `PUT /api/employees/{id:guid}` cập nhật hồ sơ thành viên.
 */
export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<EmployeeDetail> {
  return apiPut<EmployeeDetail>(`/employees/${id}`, payload);
}

/**
 * Gọi endpoint `DELETE /api/employees/{id:guid}` thực hiện thủ tục thôi việc (Offboarding + thu hồi tài khoản).
 */
export async function terminateEmployee(
  id: string,
  payload: TerminateEmployeePayload
): Promise<boolean> {
  return apiDelete<boolean>(`/employees/${id}`, payload);
}
