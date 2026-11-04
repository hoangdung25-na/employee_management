import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import { PagedResult } from "@/types/api";
import {
  CreateTimesheetEntryInput,
  ReviewTimesheetEntryInput,
  TimesheetEntry,
  TimesheetQueryParams,
  TimesheetSummary,
  UpdateTimesheetEntryInput,
} from "../types/timesheet";

/**
 * Lấy danh sách các bản ghi timesheet có phân trang theo bộ lọc ngày, dự án, trạng thái và phân quyền.
 */
export async function getTimesheets(
  params?: TimesheetQueryParams
): Promise<PagedResult<TimesheetEntry>> {
  return apiGet<PagedResult<TimesheetEntry>>(
    "/timesheets",
    params as Record<string, unknown>
  );
}

/**
 * Lấy tổng hợp số giờ làm theo khoảng thời gian (Tổng giờ, Tính phí, Chờ duyệt, Đã duyệt).
 */
export async function getTimesheetSummary(params?: {
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
}): Promise<TimesheetSummary> {
  return apiGet<TimesheetSummary>(
    "/timesheets/summary",
    params as Record<string, unknown>
  );
}

/**
 * Kê khai thêm một dòng công việc / giờ làm mới.
 */
export async function createTimesheetEntry(
  payload: CreateTimesheetEntryInput
): Promise<TimesheetEntry> {
  return apiPost<TimesheetEntry>("/timesheets", payload);
}

/**
 * Chỉnh sửa bản ghi timesheet (nếu ở trạng thái Draft/Submitted).
 */
export async function updateTimesheetEntry(
  id: string,
  payload: UpdateTimesheetEntryInput
): Promise<TimesheetEntry> {
  return apiPut<TimesheetEntry>(`/timesheets/${id}`, payload);
}

/**
 * Phê duyệt hoặc từ chối một bản ghi timesheet (Dành cho Quản lý / HR).
 */
export async function reviewTimesheetEntry(
  id: string,
  payload: ReviewTimesheetEntryInput
): Promise<TimesheetEntry> {
  return apiPut<TimesheetEntry>(`/timesheets/${id}/review`, payload);
}

/**
 * Nộp phê duyệt hàng loạt các bản ghi nháp (Draft) trong tuần/kỳ.
 */
export async function batchSubmitTimesheets(payload: {
  entryIds?: string[];
  fromDate?: string;
  toDate?: string;
}): Promise<number> {
  return apiPost<number>("/timesheets/batch-submit", payload);
}

/**
 * Xóa một bản ghi timesheet (Soft Delete).
 */
export async function deleteTimesheetEntry(id: string): Promise<boolean> {
  return apiDelete<boolean>(`/timesheets/${id}`);
}

