using EmployeeManagement.Domain.Common;

namespace EmployeeManagement.Domain.Leaves.Entities;

/// <summary>
/// Type of leave (Annual leave, sick leave, unpaid personal leave).
/// </summary>
public class LeaveType : BaseEntity
{
    public string LeaveTypeCode { get; set; } = string.Empty;
    public string LeaveTypeName { get; set; } = string.Empty;
    public decimal DefaultDaysPerYear { get; set; } = 12.0m;
    public bool IsPaid { get; set; } = true;
    public bool RequiresAttachment { get; set; } = false;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation collections
    public ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();
    public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
}
