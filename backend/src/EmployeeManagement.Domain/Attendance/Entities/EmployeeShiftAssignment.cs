using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;

namespace EmployeeManagement.Domain.Attendance.Entities;

/// <summary>
/// Assignment of an employee to a specific work shift with validity range.
/// </summary>
public class EmployeeShiftAssignment : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Guid WorkShiftId { get; set; }
    public DateOnly EffectiveDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public Employee Employee { get; set; } = null!;
    public WorkShift WorkShift { get; set; } = null!;
}

