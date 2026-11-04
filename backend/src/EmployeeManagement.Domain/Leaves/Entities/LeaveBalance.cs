using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;

namespace EmployeeManagement.Domain.Leaves.Entities;

/// <summary>
/// Employee leave balance / quota for a specific leave type and year.
/// RemainingDays is computed automatically by SQL Server: (EntitledDays + CarriedOverDays - UsedDays - PendingDays).
/// </summary>
public class LeaveBalance : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public int LeaveYear { get; set; }
    public decimal EntitledDays { get; set; } = 12.0m;
    public decimal CarriedOverDays { get; set; } = 0m;
    public decimal UsedDays { get; set; } = 0m;
    public decimal PendingDays { get; set; } = 0m;
    public decimal? RemainingDays { get; set; }

    // Navigation properties
    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
}
