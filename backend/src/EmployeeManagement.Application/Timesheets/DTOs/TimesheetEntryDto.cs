namespace EmployeeManagement.Application.Timesheets.DTOs;

/// <summary>
/// Data Transfer Object representing a timesheet entry.
/// </summary>
public class TimesheetEntryDto
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeFullName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateOnly WorkDate { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TaskTitle { get; set; } = string.Empty;
    public decimal HoursWorked { get; set; }
    public bool IsBillable { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? ApprovedByEmployeeId { get; set; }
    public string? ApproverFullName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

