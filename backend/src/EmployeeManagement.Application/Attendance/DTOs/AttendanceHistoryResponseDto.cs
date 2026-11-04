namespace EmployeeManagement.Application.Attendance.DTOs;

/// <summary>
/// Monthly attendance history response with summary statistics.
/// </summary>
public record AttendanceHistoryResponseDto(
    int Month,
    int Year,
    int TotalPresent,
    int TotalLate,
    int TotalEarlyLeave,
    int TotalOnLeave,
    decimal TotalWorkingHours,
    decimal TotalOvertimeHours,
    IReadOnlyList<AttendanceLogDto> Items
);

