
export type EmployeeStatus =
  | "Probation"
  | "Active"
  | "Suspended"
  | "Terminated";


export interface EmployeeSummary {
  id: string;
  employeeCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  workEmail: string;
  phoneNumber?: string | null;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  directManagerName?: string | null;
  baseSalary: number;
  avatarUrl?: string | null;
  hireDate: string;
  status: EmployeeStatus | string;
  isDepartmentHead?: boolean;
}


export interface EmployeeDetail {
  id: string;
  employeeCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  citizenId: string;
  phoneNumber?: string | null;
  workEmail: string;
  personalEmail?: string | null;
  address?: string | null;
  hireDate: string;
  probationEndDate?: string | null;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  directManagerId?: string | null;
  directManagerName?: string | null;
  baseSalary: number;
  taxCode?: string | null;
  socialInsuranceNumber?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  avatarUrl?: string | null;
  status: EmployeeStatus | string;
  terminationDate?: string | null;
  terminationReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isDepartmentHead?: boolean;
}

/**
 * Payload tiếp nhận thành viên mới (`POST /api/employees`)
 */
export interface CreateEmployeePayload {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  citizenId: string;
  phoneNumber?: string | null;
  workEmail: string;
  personalEmail?: string | null;
  address?: string | null;
  hireDate: string;
  departmentId: string;
  positionId: string;
  directManagerId?: string | null;
  baseSalary: number;
  avatarUrl?: string | null;
  status?: EmployeeStatus | string;
  probationEndDate?: string | null;
  taxCode?: string | null;
  socialInsuranceNumber?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
}


export interface UpdateEmployeePayload {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber?: string | null;
  personalEmail?: string | null;
  address?: string | null;
  departmentId: string;
  positionId: string;
  directManagerId?: string | null;
  baseSalary: number;
  avatarUrl?: string | null;
  status: EmployeeStatus | string;
  citizenId?: string | null;
  hireDate?: string | null;
  probationEndDate?: string | null;
  taxCode?: string | null;
  socialInsuranceNumber?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
}


export interface TerminateEmployeePayload {
  terminationDate: string;
  terminationReason: string;
}


export interface EmployeeFilterParams {
  keyword?: string;
  departmentId?: string;
  status?: EmployeeStatus | "";
  pageNumber?: number;
  pageSize?: number;
  sortBy?: "FullName" | "BaseSalary" | "EmployeeCode" | "HireDate";
  sortOrder?: "asc" | "desc";
}


export interface ManagerOption {
  id: string;
  employeeCode: string;
  fullName: string;
  positionName: string;
  departmentName: string;
  jobLevel: number;
  isDepartmentHead: boolean;
}

/**
 * Lựa chọn Quản lý trực tiếp phân cấp theo phòng ban & JobLevel (`GET /api/employees/managers`)
 */
export interface ManagerOption {
  id: string;
  employeeCode: string;
  fullName: string;
  positionName: string;
  departmentName: string;
  jobLevel: number;
  isDepartmentHead: boolean;
}
