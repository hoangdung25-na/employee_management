namespace EmployeeManagement.Domain.Users.Consts;

/// <summary>
/// Centralized constants, role codes, permission codes, and security policies for the Identity & RBAC module.
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

    // --- 4. Anti-Brute Force & Password Policies ---
    public const int MaxFailedLoginAttempts = 5;
    public const int DefaultLockoutMinutes = 30;
    public const int MinPasswordLength = 6;
    public const int MinStrongPasswordLength = 8;

    // --- 5. Standard 5-Role Codes (Hybrid Back-Office HRM & ESS) ---
    public static class Roles
    {
        public const string SuperAdmin = "SUPER_ADMIN";
        public const string HrManager = "HR_MANAGER";
        public const string HrStaff = "HR_STAFF";
        public const string Manager = "MANAGER";
        public const string Employee = "EMPLOYEE";
    }

    // --- 6. Standard Atomic Permission Codes ---
    public static class Permissions
    {
        // Department Module
        public const string DepartmentView = "Department.View";
        public const string DepartmentCreate = "Department.Create";
        public const string DepartmentUpdate = "Department.Update";
        public const string DepartmentDelete = "Department.Delete";

        // Employee Module
        public const string EmployeeView = "Employee.View";
        public const string EmployeeViewDetail = "Employee.ViewDetail";
        public const string EmployeeViewSelf = "Employee.ViewSelf";
        public const string EmployeeCreate = "Employee.Create";
        public const string EmployeeUpdate = "Employee.Update";
        public const string EmployeeTerminate = "Employee.Terminate";

        // User & Auth Module
        public const string UserView = "User.View";
        public const string UserCreate = "User.Create";
        public const string AuthChangePassword = "Auth.ChangePassword";

        // Expanded HRM & ESS Modules
        public const string DocumentManage = "Document.Manage";
        public const string OnboardingManage = "Onboarding.Manage";
        public const string AttendanceCheckInSelf = "Attendance.CheckInSelf";
        public const string AttendanceManage = "Attendance.Manage";
        public const string TimesheetSubmitSelf = "Timesheet.SubmitSelf";
        public const string TimesheetApprove = "Timesheet.Approve";
        public const string LeaveRequestSelf = "Leave.RequestSelf";
        public const string LeaveApprove = "Leave.Approve";
        public const string PerformanceSelfReview = "Performance.SelfReview";
        public const string PerformanceEvaluate = "Performance.Evaluate";
        public const string TrainingViewSelf = "Training.ViewSelf";
        public const string TrainingManage = "Training.Manage";
        public const string AnalyticsView = "Analytics.View";
    }
}

