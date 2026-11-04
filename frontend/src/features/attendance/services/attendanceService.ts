import { apiGet, apiPost } from "@/lib/api/client";
import {
  AttendanceHistoryResponse,
  AttendanceLog,
  TodayAttendanceStatus,
  WorkShift,
} from "../types/attendance";

/**
/// Lấy thông tin trạng thái chấm công và ca làm việc hôm nay (ESS Widget).
 */
export async function getTodayAttendance(
  employeeId?: string
): Promise<TodayAttendanceStatus> {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employeeId = employeeId;
  return apiGet<TodayAttendanceStatus>("/attendance/today", params);
}

/**
 * Thực hiện chấm công Check-in hàng ngày trên Web.
 */
export async function checkIn(notes?: string): Promise<AttendanceLog> {
  return apiPost<AttendanceLog>("/attendance/check-in", { notes });
}

/**
 * Thực hiện chấm công Check-out khi hết ca.
 */
export async function checkOut(notes?: string): Promise<AttendanceLog> {
  return apiPost<AttendanceLog>("/attendance/check-out", { notes });
}

/**
 * Lấy lịch sử chấm công theo tháng/năm với các chỉ số tổng hợp.
 */
export async function getAttendanceHistory(params: {
  month?: number;
  year?: number;
  employeeId?: string;
  departmentId?: string;
}): Promise<AttendanceHistoryResponse> {
  return apiGet<AttendanceHistoryResponse>(
    "/attendance/history",
    params as Record<string, unknown>
  );
}

/**
 * Lấy danh sách các ca làm việc đang hoạt động.
 */
export async function getWorkShifts(): Promise<WorkShift[]> {
  return apiGet<WorkShift[]>("/attendance/shifts");
}

