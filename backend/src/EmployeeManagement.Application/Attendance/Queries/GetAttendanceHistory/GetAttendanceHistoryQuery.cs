using EmployeeManagement.Application.Attendance.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Attendance.Queries.GetAttendanceHistory;

/// <summary>
/// Query to retrieve monthly attendance history with summary statistics.
/// </summary>
public record GetAttendanceHistoryQuery(
    int Month,
    int Year,
    Guid? EmployeeId = null,
    Guid? DepartmentId = null
) : IRequest<AttendanceHistoryResponseDto>;

