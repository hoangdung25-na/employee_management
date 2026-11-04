namespace EmployeeManagement.Application.Attendance.DTOs;

/// <summary>
/// DTO representing an individual attendance log.
/// </summary>
public record AttendanceLogDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string EmployeeCode,
    Guid WorkShiftId,
    string ShiftName,
    string ShiftCode,
    DateOnly AttendanceDate,
    DateTime? CheckInTime,
    DateTime? CheckOutTime,
    string CheckInMethod,
    string? CheckInIpAddress,
    decimal WorkingHours,
    decimal OvertimeHours,
    int LateMinutes,
    int EarlyLeaveMinutes,
    string Status,
    string? Notes
);
