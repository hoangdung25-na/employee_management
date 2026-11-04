using EmployeeManagement.Application.Attendance.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Attendance.Commands.CheckIn;

/// <summary>
/// Command to perform a daily attendance check-in.
/// </summary>
public record CheckInCommand(
    Guid? TargetEmployeeId = null,
    string? IpAddress = null,
    string? Notes = null
) : IRequest<AttendanceLogDto>;

