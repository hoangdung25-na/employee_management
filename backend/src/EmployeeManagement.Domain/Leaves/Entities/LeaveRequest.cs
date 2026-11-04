using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Leaves.Consts;

namespace EmployeeManagement.Domain.Leaves.Entities;

/// <summary>
/// Individual leave application submitted by an employee with approval workflow.
/// </summary>
public class LeaveRequest : BaseEntity
{
    public string RequestCode { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string Status { get; set; } = LeaveConsts.LeaveStatuses.Pending;
    public Guid? ReviewedByEmployeeId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComment { get; set; }

    // Navigation properties
    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
    public Employee? ReviewedByEmployee { get; set; }
}
