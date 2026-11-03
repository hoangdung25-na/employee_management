import { apiGet, apiPatch } from "@/lib/api/client";
import {
  OnboardingFilterParams,
  OnboardingTask,
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
 * Cập nhật trạng thái đầu việc (`PATCH /api/onboarding/tasks/{taskId:guid}/status`).
 */
export async function updateOnboardingTaskStatus(
  taskId: string,
  payload: UpdateTaskStatusPayload
): Promise<OnboardingTask> {
  return apiPatch<OnboardingTask>(`/onboarding/tasks/${taskId}/status`, payload);
}

