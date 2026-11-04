using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Timesheets.Consts;

namespace EmployeeManagement.Domain.Timesheets.Entities;

/// <summary>
/// Project and task level timesheet record for employees with review workflow.
/// </summary>
public class TimesheetEntry : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public DateOnly WorkDate { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TaskTitle { get; set; } = string.Empty;
    public decimal HoursWorked { get; set; }
    public bool IsBillable { get; set; } = true;
    public string? Description { get; set; }
    public string Status { get; set; } = TimesheetConsts.Status.Submitted;
    public Guid? ApprovedByEmployeeId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }

    // Navigation properties
    public Employee Employee { get; set; } = null!;
    public Employee? ApprovedByEmployee { get; set; }
}

