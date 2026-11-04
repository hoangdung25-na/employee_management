using EmployeeManagement.Application.Attendance.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Attendance.Queries.GetTodayAttendance;

/// <summary>
/// Query to retrieve today's real-time attendance status and shift configuration for an employee.
/// </summary>
public record GetTodayAttendanceQuery(Guid? TargetEmployeeId = null) : IRequest<TodayAttendanceStatusDto>;
