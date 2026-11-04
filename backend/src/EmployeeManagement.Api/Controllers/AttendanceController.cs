using EmployeeManagement.Application.Attendance.Commands.CheckIn;
using EmployeeManagement.Application.Attendance.Commands.CheckOut;
using EmployeeManagement.Application.Attendance.DTOs;
using EmployeeManagement.Application.Attendance.Queries.GetAttendanceHistory;
using EmployeeManagement.Application.Attendance.Queries.GetTodayAttendance;
using EmployeeManagement.Application.Attendance.Queries.GetWorkShifts;
using EmployeeManagement.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller managing daily attendance punches (Check-in/Check-out),
/// shift assignments, and monthly timesheet records.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly ISender _sender;

    public AttendanceController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves today's real-time attendance and shift status for the authenticated employee.
    /// Used by the real-time clock widget in the ESS dashboard.
    /// </summary>
    [HttpGet("today")]
    [ProducesResponseType(typeof(ApiResponse<TodayAttendanceStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTodayStatus([FromQuery] Guid? employeeId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetTodayAttendanceQuery(employeeId), cancellationToken);
        return Ok(ApiResponse<TodayAttendanceStatusDto>.SuccessResult(result, "Lấy thông tin chấm công hôm nay thành công."));
    }

    /// <summary>
    /// Performs daily Web Check-in for the authenticated employee.
    /// Automatically calculates late minutes against the assigned work shift grace period.
    /// </summary>
    [HttpPost("check-in")]
    [ProducesResponseType(typeof(ApiResponse<AttendanceLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest? request, CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var command = new CheckInCommand(request?.EmployeeId, clientIp, request?.Notes);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AttendanceLogDto>.SuccessResult(result, "Check-in thành công. Chúc bạn một ngày làm việc hiệu quả!"));
    }

    /// <summary>
    /// Performs daily Web Check-out for the authenticated employee.
    /// Computes working hours, early departure, and overtime hours.
    /// </summary>
    [HttpPost("check-out")]
    [ProducesResponseType(typeof(ApiResponse<AttendanceLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutRequest? request, CancellationToken cancellationToken)
    {
        var command = new CheckOutCommand(request?.EmployeeId, request?.Notes);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AttendanceLogDto>.SuccessResult(result, "Check-out thành công. Hẹn gặp lại bạn!"));
    }

    /// <summary>
    /// Retrieves monthly attendance logs and summary metrics for an employee or department.
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(ApiResponse<AttendanceHistoryResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] Guid? employeeId,
        [FromQuery] Guid? departmentId,
        CancellationToken cancellationToken)
    {
        var targetMonth = month ?? DateTime.Now.Month;
        var targetYear = year ?? DateTime.Now.Year;

        var query = new GetAttendanceHistoryQuery(targetMonth, targetYear, employeeId, departmentId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AttendanceHistoryResponseDto>.SuccessResult(result, "Tải lịch sử chấm công thành công."));
    }

    /// <summary>
    /// Retrieves all active work shifts configured in the system.
    /// </summary>
    [HttpGet("shifts")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<WorkShiftDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetShifts(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetWorkShiftsQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<WorkShiftDto>>.SuccessResult(result, "Lấy danh mục ca làm việc thành công."));
    }
}

public class CheckInRequest
{
    public Guid? EmployeeId { get; set; }
    public string? Notes { get; set; }
}

public class CheckOutRequest
{
    public Guid? EmployeeId { get; set; }
    public string? Notes { get; set; }
}

