export * from "./roles";
export * from "./permissions";

import type { SystemRoleCode } from "./roles";
import type { PermissionCode } from "./permissions";

export interface AuthSession {
  userId: string;
  employeeId?: string | null;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  mustChangePassword: boolean;
  roles: (SystemRoleCode | string)[];
  permissions: (PermissionCode | string)[];
  accessToken?: string;
  refreshToken?: string;
  expiresAtUtc?: string;
  accessTokenExpiresAt?: string;
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
  roles: (SystemRoleCode | string)[];
  permissions: (PermissionCode | string)[];
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
