using EmployeeManagement.Domain.Common;

namespace EmployeeManagement.Domain.Attendance.Entities;

/// <summary>
/// Work Shift definition (e.g., standard office hours 08:30 - 17:30, flexible shifts).
/// </summary>
public class WorkShift : BaseEntity
{
    public string ShiftCode { get; set; } = string.Empty;
    public string ShiftName { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int BreakMinutes { get; set; } = 60;
    public int GracePeriodMinutes { get; set; } = 15;
    public decimal StandardHours { get; set; } = 8.0m;
    public bool IsNightShift { get; set; } = false;
    public bool IsActive { get; set; } = true;

    // Navigation collections
    public ICollection<EmployeeShiftAssignment> ShiftAssignments { get; set; } = new List<EmployeeShiftAssignment>();
    public ICollection<AttendanceLog> AttendanceLogs { get; set; } = new List<AttendanceLog>();
}
