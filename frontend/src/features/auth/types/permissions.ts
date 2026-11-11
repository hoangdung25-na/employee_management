/**
 * Centralized permission constants and hierarchy types for RBAC policies.
 * Eliminates magic strings and provides IntelliSense autocomplete across the frontend.
 */

export const PERMISSIONS = {
  EMPLOYEES: {
    VIEW: "Employee.View",
    VIEW_DETAIL: "Employee.ViewDetail",
    VIEW_SELF: "Employee.ViewSelf",
    CREATE: "Employee.Create",
    UPDATE: "Employee.Update",
    TERMINATE: "Employee.Terminate",
    DOCUMENT_MANAGE: "Document.Manage",
  },
  DEPARTMENTS: {
    VIEW: "Department.View",
    CREATE: "Department.Create",
    UPDATE: "Department.Update",
    DELETE: "Department.Delete",
  },
  DECISIONS: {
    VIEW: "Decision.View",
    MANAGE: "Decision.Manage",
  },
  ONBOARDING: {
    MANAGE: "Onboarding.Manage",
  },
  ATTENDANCE: {
    CHECK_IN_SELF: "Attendance.CheckInSelf",
    MANAGE: "Attendance.Manage",
  },
  TIMESHEETS: {
    SUBMIT_SELF: "Timesheet.SubmitSelf",
    APPROVE: "Timesheet.Approve",
  },
  LEAVES: {
    REQUEST_SELF: "Leave.RequestSelf",
    APPROVE: "Leave.Approve",
  },
  PERFORMANCE: {
    SELF_REVIEW: "Performance.SelfReview",
    EVALUATE: "Performance.Evaluate",
  },
  TRAINING: {
    VIEW_SELF: "Training.ViewSelf",
    MANAGE: "Training.Manage",
  },
  ANALYTICS: {
    VIEW: "Analytics.View",
  },
  USERS: {
    VIEW: "User.View",
    CREATE: "User.Create",
    CHANGE_PASSWORD: "Auth.ChangePassword",
  },
} as const;

export type PermissionCode =
  | (typeof PERMISSIONS.EMPLOYEES)[keyof typeof PERMISSIONS.EMPLOYEES]
  | (typeof PERMISSIONS.DEPARTMENTS)[keyof typeof PERMISSIONS.DEPARTMENTS]
  | (typeof PERMISSIONS.DECISIONS)[keyof typeof PERMISSIONS.DECISIONS]
  | (typeof PERMISSIONS.ONBOARDING)[keyof typeof PERMISSIONS.ONBOARDING]
  | (typeof PERMISSIONS.ATTENDANCE)[keyof typeof PERMISSIONS.ATTENDANCE]
  | (typeof PERMISSIONS.TIMESHEETS)[keyof typeof PERMISSIONS.TIMESHEETS]
  | (typeof PERMISSIONS.LEAVES)[keyof typeof PERMISSIONS.LEAVES]
  | (typeof PERMISSIONS.PERFORMANCE)[keyof typeof PERMISSIONS.PERFORMANCE]
  | (typeof PERMISSIONS.TRAINING)[keyof typeof PERMISSIONS.TRAINING]
  | (typeof PERMISSIONS.ANALYTICS)[keyof typeof PERMISSIONS.ANALYTICS]
  | (typeof PERMISSIONS.USERS)[keyof typeof PERMISSIONS.USERS];

/**
 * Node within the permission tree hierarchy.
 */
export interface PermissionNode {
  code: string;
  displayName: string;
  description?: string | null;
}

/**
 * Functional module group returned by GET /api/auth/permissions-tree.
 */
export interface PermissionModuleGroup {
  moduleCode: string;
  moduleName: string;
  description?: string | null;
  permissions: PermissionNode[];
}

