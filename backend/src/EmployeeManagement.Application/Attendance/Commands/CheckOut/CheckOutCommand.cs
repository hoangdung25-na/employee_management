using EmployeeManagement.Application.Attendance.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Attendance.Commands.CheckOut;

/// <summary>
/// Command to perform a daily attendance check-out.
/// </summary>
public record CheckOutCommand(
    Guid? TargetEmployeeId = null,
    string? Notes = null
) : IRequest<AttendanceLogDto>;

