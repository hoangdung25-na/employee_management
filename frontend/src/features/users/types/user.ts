export interface UserSummary {
  id: string;
  employeeId: string | null;
  employeeCode: string;
  username: string;
  fullName: string;
  email: string;
  departmentName: string | null;
  positionName: string | null;
  roles: string[];
  roleNames: string[];
  permissions: string[];
  isActive: boolean;
  isLocked: boolean;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface RoleOption {
  id: string;
  roleCode: string;
  roleName: string;
  description: string | null;
  defaultPermissions: string[];
}

export interface UnlinkedEmployeeOption {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  departmentName: string;
  positionName: string;
}

export interface GetUsersParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  roleCode?: string;
  isActive?: boolean;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  employeeId: string | null;
  roleCodes: string[];
  customPermissions?: string[] | null;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface UpdateUserPayload {
  email: string;
  employeeId: string | null;
  roleCodes: string[];
  customPermissions?: string[] | null;
  newPassword?: string | null;
  isActive: boolean;
  unlockAccount: boolean;
  mustChangePassword: boolean;
}
