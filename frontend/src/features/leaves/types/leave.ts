export interface LeaveType {
  id: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
  requiresAttachment: boolean;
  description?: string | null;
  isActive: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  isPaid: boolean;
  leaveYear: number;
  entitledDays: number;
  carriedOverDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeaveRequest {
  id: string;
  requestCode: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName?: string | null;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  reviewedByEmployeeId?: string | null;
  reviewedByEmployeeName?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  createdAt: string;
}

export interface CreateLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  targetEmployeeId?: string;
}

