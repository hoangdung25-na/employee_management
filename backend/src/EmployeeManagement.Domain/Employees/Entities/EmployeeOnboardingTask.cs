using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Users.Entities;

namespace EmployeeManagement.Domain.Employees.Entities;

/// <summary>
/// An actionable onboarding or offboarding task assigned to an employee or department handler.
/// </summary>
public class EmployeeOnboardingTask : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public string ProcessType { get; set; } = string.Empty; // 'Onboarding', 'Offboarding'
    public string TaskName { get; set; } = string.Empty;
    public string AssignedRole { get; set; } = string.Empty; // 'HR', 'IT', 'MANAGER', 'EMPLOYEE'

    public Guid? AssignedToEmployeeId { get; set; }
    public Employee? AssignedToEmployee { get; set; }

    public DateOnly DueDate { get; set; }
    public string Status { get; set; } = "Pending"; // 'Pending', 'InProgress', 'Completed', 'Skipped'

    public DateTime? CompletedAt { get; set; }
    public Guid? CompletedByUserId { get; set; }
    public User? CompletedByUser { get; set; }

    public string? Notes { get; set; }
}
