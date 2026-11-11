namespace EmployeeManagement.Domain.Users.Consts;

/// <summary>
/// Centralized atomic permission codes organized by functional module.
/// Eliminates magic strings and provides strong compile-time typing for RBAC policies.
/// </summary>
public static class PermissionNames
{
    public static class Departments
    {
        public const string View = "Department.View";
        public const string Create = "Department.Create";
        public const string Update = "Department.Update";
        public const string Delete = "Department.Delete";
    }

    public static class Employees
    {
        public const string View = "Employee.View";
        public const string ViewDetail = "Employee.ViewDetail";
        public const string ViewSelf = "Employee.ViewSelf";
        public const string Create = "Employee.Create";
        public const string Update = "Employee.Update";
        public const string Terminate = "Employee.Terminate";
        public const string DocumentManage = "Document.Manage";
    }

    public static class Decisions
    {
        public const string View = "Decision.View";
        public const string Manage = "Decision.Manage";
    }

    public static class Onboarding
    {
        public const string Manage = "Onboarding.Manage";
    }

    public static class Attendance
    {
        public const string CheckInSelf = "Attendance.CheckInSelf";
        public const string Manage = "Attendance.Manage";
    }

    public static class Timesheets
    {
        public const string SubmitSelf = "Timesheet.SubmitSelf";
        public const string Approve = "Timesheet.Approve";
    }

    public static class Leaves
    {
        public const string RequestSelf = "Leave.RequestSelf";
        public const string Approve = "Leave.Approve";
    }

    public static class Performance
    {
        public const string SelfReview = "Performance.SelfReview";
        public const string Evaluate = "Performance.Evaluate";
    }

    public static class Training
    {
        public const string ViewSelf = "Training.ViewSelf";
        public const string Manage = "Training.Manage";
    }

    public static class Analytics
    {
        public const string View = "Analytics.View";
    }

    public static class Users
    {
        public const string View = "User.View";
        public const string Create = "User.Create";
        public const string ChangePassword = "Auth.ChangePassword";
    }

    public static IReadOnlyList<string> GetAll() =>
    [
        Departments.View,
        Departments.Create,
        Departments.Update,
        Departments.Delete,
        Employees.View,
        Employees.ViewDetail,
        Employees.ViewSelf,
        Employees.Create,
        Employees.Update,
        Employees.Terminate,
        Employees.DocumentManage,
        Decisions.View,
        Decisions.Manage,
        Onboarding.Manage,
        Attendance.CheckInSelf,
        Attendance.Manage,
        Timesheets.SubmitSelf,
        Timesheets.Approve,
        Leaves.RequestSelf,
        Leaves.Approve,
        Performance.SelfReview,
        Performance.Evaluate,
        Training.ViewSelf,
        Training.Manage,
        Analytics.View,
        Users.View,
        Users.Create,
        Users.ChangePassword
    ];

    public static List<string> ResolveEffectivePermissions(
        string? customPermissionsCsv,
        IEnumerable<string> roleCodes,
        IEnumerable<string> rolePermissionCodes,
        string? username = null)
    {
        var validSet = new HashSet<string>(GetAll(), StringComparer.OrdinalIgnoreCase);
        List<string> resolved;
        if (customPermissionsCsv is not null)
        {
            resolved = customPermissionsCsv
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(p => validSet.Contains(p))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        else if (roleCodes.Any(r => string.Equals(r, AppRoles.SuperAdmin, StringComparison.OrdinalIgnoreCase)))
        {
            resolved = GetAll().ToList();
        }
        else
        {
            resolved = rolePermissionCodes
                .Where(p => validSet.Contains(p))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        // Ensure root admin account can never lock itself out of User Management
        if (string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase))
        {
            if (!resolved.Contains(Users.View, StringComparer.OrdinalIgnoreCase))
                resolved.Add(Users.View);
            if (!resolved.Contains(Users.Create, StringComparer.OrdinalIgnoreCase))
                resolved.Add(Users.Create);
        }

        return resolved
            .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}

