export type ProcessType = "Onboarding" | "Offboarding";

export type TaskStatus = "Pending" | "InProgress" | "Completed" | "Skipped";

export type AssignedRole = "HR" | "IT" | "MANAGER" | "EMPLOYEE";

export interface OnboardingTask {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  processType: ProcessType;
  taskName: string;
  assignedRole: AssignedRole;
  assignedToEmployeeId: string | null;
  assignedToEmployeeName: string | null;
  dueDate: string;
  status: TaskStatus;
  completedAt: string | null;
  completedByUserId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface OnboardingFilterParams {
  employeeId?: string;
  processType?: string;
  assignedRole?: string;
  status?: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
  notes?: string | null;
}
