using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Leaves.Commands.CancelLeaveRequest;
using EmployeeManagement.Application.Leaves.Commands.CreateLeaveRequest;
using EmployeeManagement.Application.Leaves.Commands.ReviewLeaveRequest;
using EmployeeManagement.Application.Leaves.DTOs;
using EmployeeManagement.Application.Leaves.Queries.GetLeaveRequests;
using EmployeeManagement.Application.Leaves.Queries.GetLeaveTypes;
using EmployeeManagement.Application.Leaves.Queries.GetMyLeaveBalances;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller managing leave entitlements, leave requests, and approval workflows.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class LeavesController : ControllerBase
{
    private readonly ISender _sender;

    public LeavesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves all active leave types (Annual, Sick, Unpaid, etc.).
    /// </summary>
    [HttpGet("types")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LeaveTypeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTypes(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetLeaveTypesQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LeaveTypeDto>>.SuccessResult(result, "Lấy danh mục loại nghỉ phép thành công."));
    }

    /// <summary>
    /// Retrieves leave balances (Entitled, CarriedOver, Used, Pending, Remaining) for the authenticated employee.
    /// </summary>
    [HttpGet("my-balances")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LeaveBalanceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyBalances(
        [FromQuery] int? year,
        [FromQuery] Guid? employeeId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetMyLeaveBalancesQuery(year, employeeId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LeaveBalanceDto>>.SuccessResult(result, "Lấy thông tin quỹ phép thành công."));
    }

    /// <summary>
    /// Retrieves leave requests with status/date filtering and ESS data isolation.
    /// </summary>
    [HttpGet("requests")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LeaveRequestDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRequests(
        [FromQuery] string? status,
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] Guid? employeeId,
        CancellationToken cancellationToken)
    {
        var query = new GetLeaveRequestsQuery(status, year, month, employeeId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LeaveRequestDto>>.SuccessResult(result, "Tải danh sách đơn xin nghỉ phép thành công."));
    }

    /// <summary>
    /// Submits a new leave application.
    /// Locks the employee's quota and sets request status to Pending.
    /// </summary>
    [HttpPost("requests")]
    [ProducesResponseType(typeof(ApiResponse<LeaveRequestDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRequest(
        [FromBody] CreateLeaveRequestDto dto,
        CancellationToken cancellationToken)
    {
        var command = new CreateLeaveRequestCommand(
            dto.LeaveTypeId,
            dto.StartDate,
            dto.EndDate,
            dto.TotalDays,
            dto.Reason,
            dto.AttachmentUrl,
            dto.TargetEmployeeId);

        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<LeaveRequestDto>.SuccessResult(result, "Gửi đơn xin nghỉ phép thành công. Vui lòng chờ quản lý phê duyệt.");
        return CreatedAtAction(nameof(GetRequests), new { id = result.Id }, response);
    }

    /// <summary>
    /// Approves or rejects an employee's leave request.
    /// Accessible by Manager or HR with Leave.Approve permission.
    /// </summary>
    [HttpPut("requests/{id:guid}/review")]
    [Authorize(Policy = UserConsts.Permissions.LeaveApprove)]
    [ProducesResponseType(typeof(ApiResponse<LeaveRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ReviewRequest(
        Guid id,
        [FromBody] ReviewLeaveRequestDto dto,
        CancellationToken cancellationToken)
    {
        var command = new ReviewLeaveRequestCommand(id, dto.IsApproved, dto.ReviewComment);
        var result = await _sender.Send(command, cancellationToken);
        var message = dto.IsApproved ? "Đã phê duyệt đơn xin nghỉ phép thành công." : "Đã từ chối đơn xin nghỉ phép.";
        return Ok(ApiResponse<LeaveRequestDto>.SuccessResult(result, message));
    }

    /// <summary>
    /// Cancels / withdraws a pending leave request submitted by the employee.
    /// Automatically releases held quota in LeaveBalance.
    /// </summary>
    [HttpPut("requests/{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelRequest(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CancelLeaveRequestCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Đã hủy bỏ đơn xin nghỉ phép và hoàn lại quỹ phép thành công."));
    }
}
