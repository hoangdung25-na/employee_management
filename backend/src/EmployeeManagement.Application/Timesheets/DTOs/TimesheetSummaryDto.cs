namespace EmployeeManagement.Application.Timesheets.DTOs;

public class TimesheetSummaryDto
{
    public decimal TotalHours { get; set; }
    public decimal BillableHours { get; set; }
    public decimal PendingHours { get; set; }
    public decimal ApprovedHours { get; set; }
    public int TotalEntries { get; set; }
}

