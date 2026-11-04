namespace EmployeeManagement.Application.Attendance.DTOs;

/// <summary>
/// DTO representing a Work Shift.
/// </summary>
public record WorkShiftDto(
    Guid Id,
    string ShiftCode,
    string ShiftName,
    TimeSpan StartTime,
    TimeSpan EndTime,
    int BreakMinutes,
    int GracePeriodMinutes,
    decimal StandardHours,
    bool IsNightShift,
    bool IsActive
);

