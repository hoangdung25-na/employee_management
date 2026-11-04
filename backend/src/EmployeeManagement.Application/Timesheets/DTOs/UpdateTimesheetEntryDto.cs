namespace EmployeeManagement.Application.Timesheets.DTOs;

public class UpdateTimesheetEntryDto
{
    public DateOnly WorkDate { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TaskTitle { get; set; } = string.Empty;
    public decimal HoursWorked { get; set; }
    public bool IsBillable { get; set; } = true;
    public string? Description { get; set; }
    public bool SubmitImmediately { get; set; } = true;
}

