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
import {
  CreateEmployeeDocumentInput,
  EmployeeDocument,
} from "@/features/employees/types/document";
import {
  CreateEmployeeContractInput,
  EmployeeContract,
} from "@/features/employees/types/contract";
import {
  CreateDecisionInput,
  EmployeeDecision,
} from "@/features/employees/types/decision";

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

/**
 * Lấy danh sách tài liệu hồ sơ của nhân sự (`GET /api/employees/{id:guid}/documents`).
 */
export async function getEmployeeDocuments(
  employeeId: string
): Promise<EmployeeDocument[]> {
  return apiGet<EmployeeDocument[]>(`/employees/${employeeId}/documents`);
}

/**
 * Thêm mới tài liệu vào hồ sơ nhân sự (`POST /api/employees/{id:guid}/documents`).
 */
export async function createEmployeeDocument(
  employeeId: string,
  payload: CreateEmployeeDocumentInput
): Promise<EmployeeDocument> {
  return apiPost<EmployeeDocument>(
    `/employees/${employeeId}/documents`,
    payload
  );
}

/**
 * Xóa mềm tài liệu hồ sơ (`DELETE /api/employees/{id:guid}/documents/{docId:guid}`).
 */
export async function deleteEmployeeDocument(
  employeeId: string,
  docId: string
): Promise<boolean> {
  return apiDelete<boolean>(`/employees/${employeeId}/documents/${docId}`);
}

/**
 * Lấy lịch sử hợp đồng lao động của nhân sự (`GET /api/employees/{id:guid}/contracts`).
 */
export async function getEmployeeContracts(
  employeeId: string
): Promise<EmployeeContract[]> {
  return apiGet<EmployeeContract[]>(`/employees/${employeeId}/contracts`);
}

/**
 * Ký mới hợp đồng lao động (`POST /api/employees/{id:guid}/contracts`).
 */
export async function createEmployeeContract(
  employeeId: string,
  payload: CreateEmployeeContractInput
): Promise<EmployeeContract> {
  return apiPost<EmployeeContract>(
    `/employees/${employeeId}/contracts`,
    payload
  );
}

/**
 * Lấy danh sách quyết định nhân sự (`GET /api/employees/{id:guid}/decisions`).
 */
export async function getEmployeeDecisions(
  employeeId: string
): Promise<EmployeeDecision[]> {
  return apiGet<EmployeeDecision[]>(`/employees/${employeeId}/decisions`);
}

/**
 * Ban hành quyết định nhân sự mới (`POST /api/employees/{id:guid}/decisions`).
 */
export async function createEmployeeDecision(
  employeeId: string,
  payload: CreateDecisionInput
): Promise<EmployeeDecision> {
  return apiPost<EmployeeDecision>(
    `/employees/${employeeId}/decisions`,
    payload
  );
}

/**
 * Lấy chi tiết quyết định nhân sự (`GET /api/decisions/{id:guid}`).
 */
export async function getDecisionById(
  id: string
): Promise<EmployeeDecision> {
  return apiGet<EmployeeDecision>(`/decisions/${id}`);
}

/**
 * Hủy bỏ / Xóa mềm quyết định nhân sự (`DELETE /api/decisions/{id:guid}`).
 */
export async function deleteDecision(
  id: string
): Promise<boolean> {
  return apiDelete<boolean>(`/decisions/${id}`);
}

