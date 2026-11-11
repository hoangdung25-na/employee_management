namespace EmployeeManagement.Domain.Users.Consts;

/// <summary>
/// Centralized definitions of standard system role codes across the application.
/// </summary>
public static class AppRoles
{
    public const string SuperAdmin = "SUPER_ADMIN";
    public const string HrManager = "HR_MANAGER";
    public const string HrStaff = "HR_STAFF";
    public const string Manager = "MANAGER";
    public const string Employee = "EMPLOYEE";

    /// <summary>
    /// Read-only collection containing all valid system role codes.
    /// </summary>
    public static readonly IReadOnlyList<string> All = new[]
    {
        SuperAdmin,
        HrManager,
        HrStaff,
        Manager,
        Employee
    };
}

