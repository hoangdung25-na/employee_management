export type ContractType =
  | "Probation"
  | "FixedTerm1Y"
  | "FixedTerm3Y"
  | "Indefinite"
  | "Seasonal";

export type ContractStatus = "Draft" | "Active" | "Expired" | "Terminated";

export interface EmployeeContract {
  id: string;
  contractNumber: string;
  employeeId: string;
  contractType: ContractType;
  startDate: string;
  endDate: string | null;
  signedDate: string | null;
  contractSalary: number;
  allowances: number;
  fileUrl: string | null;
  status: ContractStatus;
  notes: string | null;
  createdAt: string;
}

export interface CreateEmployeeContractInput {
  contractType: ContractType;
  startDate: string;
  endDate?: string | null;
  signedDate?: string | null;
  contractSalary: number;
  allowances: number;
  fileUrl?: string | null;
  notes?: string | null;
}
