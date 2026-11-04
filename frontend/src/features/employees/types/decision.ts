export type DecisionType = "Reward" | "Discipline" | "Transfer" | "Promotion";

export type DecisionStatus = "Draft" | "Active" | "Cancelled";

export interface EmployeeDecision {
  id: string;
  decisionNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  decisionType: DecisionType;
  title: string;
  effectiveDate: string;
  signDate?: string | null;
  signerName?: string | null;
  signerPosition?: string | null;
  amount: number;
  oldDepartmentId?: string | null;
  oldDepartmentName?: string | null;
  newDepartmentId?: string | null;
  newDepartmentName?: string | null;
  oldPositionId?: string | null;
  oldPositionName?: string | null;
  newPositionId?: string | null;
  newPositionName?: string | null;
  oldSalary?: number | null;
  newSalary?: number | null;
  reason?: string | null;
  attachmentUrl?: string | null;
  status: DecisionStatus;
  createdAt: string;
}

export interface CreateDecisionInput {
  decisionType: DecisionType;
  title: string;
  effectiveDate: string;
  signDate?: string;
  signerName?: string;
  signerPosition?: string;
  amount?: number;
  newDepartmentId?: string | null;
  newPositionId?: string | null;
  newSalary?: number | null;
  reason?: string;
  attachmentUrl?: string;
  decisionNumber?: string;
}
