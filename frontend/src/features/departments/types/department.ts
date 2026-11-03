export interface Department {
  id: string;
  departmentCode: string;
  departmentName: string;
  parentDepartmentId?: string | null;
  parentDepartmentName?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  employeeCount: number;
  isActive: boolean;
  description?: string | null;
  createdAt: string;
}

export interface DepartmentMember {
  id: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  positionName: string;
  avatarUrl?: string | null;
  status: string;
}

export interface DepartmentDetail extends Department {
  updatedAt?: string | null;
  members: DepartmentMember[];
}

export interface CreateDepartmentPayload {
  departmentCode: string;
  departmentName: string;
  parentDepartmentId?: string | null;
  managerId?: string | null;
  description?: string | null;
}

export interface UpdateDepartmentPayload {
  departmentName: string;
  parentDepartmentId?: string | null;
  managerId?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface PositionItem {
  id: string;
  positionCode: string;
  positionName: string;
  description?: string | null;
  isActive: boolean;
}

