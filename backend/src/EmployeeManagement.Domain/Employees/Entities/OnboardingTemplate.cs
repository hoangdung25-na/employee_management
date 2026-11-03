using EmployeeManagement.Domain.Common;

namespace EmployeeManagement.Domain.Employees.Entities;

/// <summary>
/// Master template for onboarding and offboarding task workflows.
/// </summary>
public class OnboardingTemplate : BaseEntity
{
    public string TemplateCode { get; set; } = string.Empty;
    public string ProcessType { get; set; } = string.Empty; // 'Onboarding', 'Offboarding'
    public string TaskName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string AssignedRole { get; set; } = string.Empty; // 'HR', 'IT', 'MANAGER', 'EMPLOYEE'
    public int DefaultDueDays { get; set; } = 3;
    public int SortOrder { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}
