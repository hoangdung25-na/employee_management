import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import {
  CreateOnboardingTaskPayload,
  OnboardingFilterParams,
  OnboardingTask,
  UpdateOnboardingTaskPayload,
  UpdateTaskStatusPayload,
} from "@/features/onboarding/types/onboarding";

/**
 * Lấy danh sách đầu việc Onboarding / Offboarding có lọc theo nhân viên, quy trình, vai trò, trạng thái.
 */
export async function getOnboardingTasks(
  params?: OnboardingFilterParams
): Promise<OnboardingTask[]> {
  return apiGet<OnboardingTask[]>(
    "/onboarding/tasks",
    params as Record<string, unknown>
  );
}

/**
 * Thêm mới một đầu việc Onboarding / Offboarding (`POST /api/onboarding/tasks`).
 */
export async function createOnboardingTask(
  payload: CreateOnboardingTaskPayload
): Promise<OnboardingTask> {
  return apiPost<OnboardingTask>("/onboarding/tasks", payload);
}

/**
 * Cập nhật thông tin chi tiết đầu việc (`PUT /api/onboarding/tasks/{taskId:guid}`).
 */
export async function updateOnboardingTask(
  taskId: string,
  payload: UpdateOnboardingTaskPayload
): Promise<OnboardingTask> {
  return apiPut<OnboardingTask>(`/onboarding/tasks/${taskId}`, payload);
}

/**
 * Xóa đầu việc (`DELETE /api/onboarding/tasks/{taskId:guid}`).
 */
export async function deleteOnboardingTask(taskId: string): Promise<boolean> {
  return apiDelete<boolean>(`/onboarding/tasks/${taskId}`);
}

/**
 * Cập nhật trạng thái đầu việc (`PATCH /api/onboarding/tasks/{taskId:guid}/status`).
 */
export async function updateOnboardingTaskStatus(
  taskId: string,
  payload: UpdateTaskStatusPayload
): Promise<OnboardingTask> {
  return apiPatch<OnboardingTask>(`/onboarding/tasks/${taskId}/status`, payload);
}
