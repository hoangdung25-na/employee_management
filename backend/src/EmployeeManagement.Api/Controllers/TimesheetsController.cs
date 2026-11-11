using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Timesheets.Commands.CreateTimesheetEntry;
using EmployeeManagement.Application.Timesheets.Commands.DeleteTimesheetEntry;
using EmployeeManagement.Application.Timesheets.Commands.ReviewTimesheetEntry;
using EmployeeManagement.Application.Timesheets.Commands.SubmitTimesheets;
using EmployeeManagement.Application.Timesheets.Commands.UpdateTimesheetEntry;
using EmployeeManagement.Application.Timesheets.DTOs;
using EmployeeManagement.Application.Timesheets.Queries.GetTimesheets;
using EmployeeManagement.Application.Timesheets.Queries.GetTimesheetSummary;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller managing project timesheets, work logs, and approval workflows (Phase 7).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class TimesheetsController : ControllerBase
{
    private readonly ISender _sender;

    public TimesheetsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves paginated timesheet entries with date range, project, status, and role-based data isolation.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TimesheetEntryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTimesheets(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] Guid? employeeId,
        [FromQuery] string? projectCode,
        [FromQuery] string? status,
        [FromQuery] Guid? departmentId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetTimesheetsQuery(fromDate, toDate, employeeId, projectCode, status, departmentId, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<TimesheetEntryDto>>.SuccessResult(result, "Tải danh sách timesheet thành công."));
    }

    /// <summary>
    /// Retrieves aggregated timesheet metrics (Total hours, billable hours, pending hours, approved hours).
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<TimesheetSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] Guid? employeeId,
        CancellationToken cancellationToken)
    {
        var query = new GetTimesheetSummaryQuery(fromDate, toDate, employeeId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<TimesheetSummaryDto>.SuccessResult(result, "Tải tổng hợp số giờ timesheet thành công."));
    }

    /// <summary>
    /// Submits a new timesheet entry for a project/task.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TimesheetEntryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateEntry(
        [FromBody] CreateTimesheetEntryDto dto,
        CancellationToken cancellationToken)
    {
        var command = new CreateTimesheetEntryCommand(
            dto.WorkDate,
            dto.ProjectCode,
            dto.ProjectName,
            dto.TaskTitle,
            dto.HoursWorked,
            dto.IsBillable,
            dto.Description,
            dto.SubmitImmediately,
            dto.TargetEmployeeId);

        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<TimesheetEntryDto>.SuccessResult(result, "Ghi nhận timesheet thành công.");
        return CreatedAtAction(nameof(GetTimesheets), new { id = result.Id }, response);
    }

    /// <summary>
    /// Updates an existing draft or submitted timesheet entry.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TimesheetEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEntry(
        Guid id,
        [FromBody] UpdateTimesheetEntryDto dto,
        CancellationToken cancellationToken)
    {
        var command = new UpdateTimesheetEntryCommand(
            id,
            dto.WorkDate,
            dto.ProjectCode,
            dto.ProjectName,
            dto.TaskTitle,
            dto.HoursWorked,
            dto.IsBillable,
            dto.Description,
            dto.SubmitImmediately);

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<TimesheetEntryDto>.SuccessResult(result, "Cập nhật timesheet thành công."));
    }

    /// <summary>
    /// Approves or rejects a timesheet entry.
    /// Accessible by Managers, HR Managers, or Super Admin with Timesheet.Approve permission.
    /// </summary>
    [HttpPut("{id:guid}/review")]
    [RequirePermission(PermissionNames.Timesheets.Approve)]
    [ProducesResponseType(typeof(ApiResponse<TimesheetEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReviewEntry(
        Guid id,
        [FromBody] ReviewTimesheetEntryDto dto,
        CancellationToken cancellationToken)
    {
        var command = new ReviewTimesheetEntryCommand(id, dto.IsApproved, dto.RejectionReason);
        var result = await _sender.Send(command, cancellationToken);
        var message = dto.IsApproved ? "Đã phê duyệt bản ghi timesheet thành công." : "Đã từ chối bản ghi timesheet.";
        return Ok(ApiResponse<TimesheetEntryDto>.SuccessResult(result, message));
    }

    /// <summary>
    /// Submits draft timesheets in batch (e.g. at the end of the week).
    /// </summary>
    [HttpPost("batch-submit")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BatchSubmit(
        [FromBody] SubmitTimesheetsCommand command,
        CancellationToken cancellationToken)
    {
        var count = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<int>.SuccessResult(count, $"Đã nộp phê duyệt {count} bản ghi timesheet."));
    }

    /// <summary>
    /// Soft deletes a timesheet entry.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEntry(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteTimesheetEntryCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Đã xóa bản ghi timesheet thành công."));
    }
}

