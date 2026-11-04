export type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeFullName: string;
  departmentName: string;
  workDate: string; // ISO 'YYYY-MM-DD'
  projectCode: string;
  projectName: string;
  taskTitle: string;
  hoursWorked: number;
  isBillable: boolean;
  description?: string | null;
  status: TimesheetStatus;
  approvedByEmployeeId?: string | null;
  approverFullName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface CreateTimesheetEntryInput {
  workDate: string;
  projectCode: string;
  projectName: string;
  taskTitle: string;
  hoursWorked: number;
  isBillable: boolean;
  description?: string;
  submitImmediately?: boolean;
  targetEmployeeId?: string;
}

export interface UpdateTimesheetEntryInput {
  workDate: string;
  projectCode: string;
  projectName: string;
  taskTitle: string;
  hoursWorked: number;
  isBillable: boolean;
  description?: string;
  submitImmediately?: boolean;
}

export interface ReviewTimesheetEntryInput {
  isApproved: boolean;
  rejectionReason?: string;
}

export interface TimesheetSummary {
  totalHours: number;
  billableHours: number;
  pendingHours: number;
  approvedHours: number;
  totalEntries: number;
}

export interface TimesheetQueryParams {
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  projectCode?: string;
  status?: string;
  departmentId?: string;
}

