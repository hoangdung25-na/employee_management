namespace EmployeeManagement.Application.Timesheets.DTOs;

public class ReviewTimesheetEntryDto
{
    public bool IsApproved { get; set; }
    public string? RejectionReason { get; set; }
}

