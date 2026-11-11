/**
 * Centralized system role definitions and display labels.
 */

export type SystemRoleCode =
  | "SUPER_ADMIN"
  | "HR_MANAGER"
  | "HR_STAFF"
  | "MANAGER"
  | "EMPLOYEE";

export const SYSTEM_ROLES: Record<SystemRoleCode, SystemRoleCode> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  HR_MANAGER: "HR_MANAGER",
  HR_STAFF: "HR_STAFF",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

/**
 * Vietnamese human-readable labels for system roles.
 */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Quản trị viên",
  HR_MANAGER: "Trưởng phòng Nhân sự",
  HR_STAFF: "Chuyên viên Nhân sự",
  MANAGER: "Quản lý bộ phận",
  EMPLOYEE: "Nhân viên",
};

/**
 * Helper to get Vietnamese role label or fallback to code.
 */
export function getRoleLabel(roleCode: string): string {
  return ROLE_LABELS[roleCode.toUpperCase()] || roleCode;
}

