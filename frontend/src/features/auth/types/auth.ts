export type SystemRoleCode =
  | "SUPER_ADMIN"
  | "HR_MANAGER"
  | "HR_STAFF"
  | "MANAGER"
  | "EMPLOYEE";

export interface AuthSession {
  userId: string;
  employeeId?: string | null;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export interface CurrentUserProfile {
  userId: string;
  employeeId?: string | null;
  username: string;
  email: string;
  fullName: string;
  departmentName?: string | null;
  positionName?: string | null;
  avatarUrl?: string | null;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
}

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

