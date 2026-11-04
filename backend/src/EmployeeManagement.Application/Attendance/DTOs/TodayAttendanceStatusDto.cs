namespace EmployeeManagement.Application.Attendance.DTOs;

/// <summary>
/// Status of today's attendance for an employee (for ESS real-time dashboard widget).
/// </summary>
public record TodayAttendanceStatusDto(
    Guid EmployeeId,
    string EmployeeName,
    DateOnly TodayDate,
    bool HasCheckedIn,
    bool HasCheckedOut,
    DateTime? CheckInTime,
    DateTime? CheckOutTime,
    decimal WorkingHours,
    int LateMinutes,
    int EarlyLeaveMinutes,
    string Status,
    WorkShiftDto AssignedShift,
    bool CanCheckIn,
    bool CanCheckOut
);
