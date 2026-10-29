namespace EmployeeManagement.Domain.Employees.Enums;

/// <summary>
/// Employment status lifecycle within the HRM system.
/// </summary>
public enum EmployeeStatus
{
    /// <summary>
    /// Employee is currently in the probation period
    /// </summary>
    Probation = 0,

    /// <summary>
    /// Official active employee
    /// </summary>
    Active = 1,

    /// <summary>
    /// Temporarily suspended contract (e.g., maternity leave, extended unpaid leave)
    /// </summary>
    Suspended = 2,

    /// <summary>
    /// Employment contract terminated / Resigned
    /// </summary>
    Terminated = 3
}
