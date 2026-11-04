using EmployeeManagement.Domain.Attendance.Consts;
using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;

namespace EmployeeManagement.Domain.Attendance.Entities;

/// <summary>
/// Daily attendance punch record (check-in / check-out, working hours, late minutes, status).
/// </summary>
public class AttendanceLog : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Guid WorkShiftId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string CheckInMethod { get; set; } = AttendanceConsts.CheckInMethods.Web;
    public string? CheckInIpAddress { get; set; }
    public decimal WorkingHours { get; set; } = 0m;
    public decimal OvertimeHours { get; set; } = 0m;
    public int LateMinutes { get; set; } = 0;
    public int EarlyLeaveMinutes { get; set; } = 0;
    public string Status { get; set; } = AttendanceConsts.AttendanceStatuses.Present;
    public string? Notes { get; set; }

    // Navigation properties
    public Employee Employee { get; set; } = null!;
    public WorkShift WorkShift { get; set; } = null!;
}
