import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import {
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
} from "../types/leave";

/**
 * Lấy danh sách các loại nghỉ phép.
 */
export async function getLeaveTypes(): Promise<LeaveType[]> {
  return apiGet<LeaveType[]>("/leaves/types");
}

/**
 * Lấy hạn mức và số ngày phép còn lại của nhân sự.
 */
export async function getMyLeaveBalances(params?: {
  year?: number;
  employeeId?: string;
}): Promise<LeaveBalance[]> {
  return apiGet<LeaveBalance[]>(
    "/leaves/my-balances",
    params as Record<string, unknown>
  );
}

/**
 * Lấy danh sách các đơn xin nghỉ phép kèm bộ lọc.
 */
export async function getLeaveRequests(params?: {
  status?: string;
  year?: number;
  month?: number;
  employeeId?: string;
}): Promise<LeaveRequest[]> {
  return apiGet<LeaveRequest[]>(
    "/leaves/requests",
    params as Record<string, unknown>
  );
}

/**
 * Nộp đơn xin nghỉ phép mới (khóa hạn mức tương ứng sang Pending).
 */
export async function createLeaveRequest(
  payload: CreateLeaveRequestInput
): Promise<LeaveRequest> {
  return apiPost<LeaveRequest>("/leaves/requests", payload);
}

/**
 * Phê duyệt hoặc từ chối đơn xin nghỉ phép (Manager / HR).
 */
export async function reviewLeaveRequest(
  id: string,
  payload: { isApproved: boolean; reviewComment?: string }
): Promise<LeaveRequest> {
  return apiPut<LeaveRequest>(`/leaves/requests/${id}/review`, payload);
}

/**
 * Hủy bỏ / thu hồi đơn xin nghỉ phép (Nhân viên tự hủy khi chưa được duyệt).
 */
export async function cancelLeaveRequest(id: string): Promise<boolean> {
  return apiPut<boolean>(`/leaves/requests/${id}/cancel`, {});
}
