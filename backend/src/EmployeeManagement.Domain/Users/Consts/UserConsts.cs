namespace EmployeeManagement.Domain.Users.Consts;

/// <summary>
/// Database column validation constraints and policies for the Identity module.
/// Role and Permission definitions have been decoupled into AppRoles and PermissionNames.
/// </summary>
public static class UserConsts
{
    // --- 1. User Column Lengths ---
    public const int MaxUsernameLength = 50;
    public const int MaxEmailLength = 150;
    public const int MaxPasswordHashLength = 255;
    public const int MaxSecurityStampLength = 100;
    public const int MaxRefreshTokenLength = 255;

    // --- 2. Role Column Lengths ---
    public const int MaxRoleCodeLength = 30;
    public const int MaxRoleNameLength = 100;
    public const int MaxRoleDescriptionLength = 250;

    // --- 3. Permission Column Lengths ---
    public const int MaxPermissionCodeLength = 50;
    public const int MaxPermissionNameLength = 150;
    public const int MaxModuleLength = 50;

    // --- 4. Anti-Brute Force, Audit Log & Password Policies ---
    public const int MaxFailedLoginAttempts = 5;
    public const int DefaultLockoutMinutes = 30;
    public const int MinPasswordLength = 6;
    public const int MinStrongPasswordLength = 8;
    public const int MaxIpAddressLength = 45;
    public const int MaxUserAgentLength = 512;
    public const int MaxFailureReasonLength = 250;

    // --- 5. Backward-Compatible Roles Mapping (Use AppRoles directly in new code) ---
    public static class Roles
    {
        public const string SuperAdmin = AppRoles.SuperAdmin;
        public const string HrManager = AppRoles.HrManager;
        public const string HrStaff = AppRoles.HrStaff;
        public const string Manager = AppRoles.Manager;
        public const string Employee = AppRoles.Employee;
    }

    // --- 6. Backward-Compatible Permissions Mapping (Use PermissionNames directly in new code) ---
    public static class Permissions
    {
        // Department Module
        public const string DepartmentView = PermissionNames.Departments.View;
        public const string DepartmentCreate = PermissionNames.Departments.Create;
        public const string DepartmentUpdate = PermissionNames.Departments.Update;
        public const string DepartmentDelete = PermissionNames.Departments.Delete;

        // Employee Module
        public const string EmployeeView = PermissionNames.Employees.View;
        public const string EmployeeViewDetail = PermissionNames.Employees.ViewDetail;
        public const string EmployeeViewSelf = PermissionNames.Employees.ViewSelf;
        public const string EmployeeCreate = PermissionNames.Employees.Create;
        public const string EmployeeUpdate = PermissionNames.Employees.Update;
        public const string EmployeeTerminate = PermissionNames.Employees.Terminate;

        // User & Auth Module
        public const string UserView = PermissionNames.Users.View;
        public const string UserCreate = PermissionNames.Users.Create;
        public const string AuthChangePassword = PermissionNames.Users.ChangePassword;

        // Expanded HRM & ESS Modules
        public const string DocumentManage = PermissionNames.Employees.DocumentManage;
        public const string DecisionView = PermissionNames.Decisions.View;
        public const string DecisionManage = PermissionNames.Decisions.Manage;
        public const string OnboardingManage = PermissionNames.Onboarding.Manage;
        public const string AttendanceCheckInSelf = PermissionNames.Attendance.CheckInSelf;
        public const string AttendanceManage = PermissionNames.Attendance.Manage;
        public const string TimesheetSubmitSelf = PermissionNames.Timesheets.SubmitSelf;
        public const string TimesheetApprove = PermissionNames.Timesheets.Approve;
        public const string LeaveRequestSelf = PermissionNames.Leaves.RequestSelf;
        public const string LeaveApprove = PermissionNames.Leaves.Approve;
        public const string PerformanceSelfReview = PermissionNames.Performance.SelfReview;
        public const string PerformanceEvaluate = PermissionNames.Performance.Evaluate;
        public const string TrainingViewSelf = PermissionNames.Training.ViewSelf;
        public const string TrainingManage = PermissionNames.Training.Manage;
        public const string AnalyticsView = PermissionNames.Analytics.View;
    }
}
