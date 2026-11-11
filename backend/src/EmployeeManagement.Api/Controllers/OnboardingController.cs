using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Onboarding.Commands.CreateOnboardingTask;
using EmployeeManagement.Application.Onboarding.Commands.DeleteOnboardingTask;
using EmployeeManagement.Application.Onboarding.Commands.UpdateOnboardingTask;
using EmployeeManagement.Application.Onboarding.Commands.UpdateOnboardingTaskStatus;
using EmployeeManagement.Application.Onboarding.DTOs;
using EmployeeManagement.Application.Onboarding.Queries.GetOnboardingTasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller managing Employee Onboarding & Offboarding workflow tasks.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class OnboardingController : ControllerBase
{
    private readonly ISender _sender;

    public OnboardingController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves a filtered list of onboarding or offboarding tasks.
    /// Can be filtered by employeeId, processType (Onboarding/Offboarding), assignedRole (HR/IT/MANAGER/EMPLOYEE), and status.
    /// </summary>
    [HttpGet("tasks")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<EmployeeOnboardingTaskDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTasks(
        [FromQuery] Guid? employeeId,
        [FromQuery] string? processType,
        [FromQuery] string? assignedRole,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var query = new GetOnboardingTasksQuery(employeeId, processType, assignedRole, status);
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<IReadOnlyList<EmployeeOnboardingTaskDto>>.SuccessResult(result, "Lấy danh sách đầu việc thành công."));
    }

    /// <summary>
    /// Creates a new onboarding or offboarding task for a specific employee.
    /// </summary>
    [HttpPost("tasks")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<EmployeeOnboardingTaskDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateTask(
        [FromBody] CreateOnboardingTaskDto dto,
        CancellationToken cancellationToken)
    {
        var command = new CreateOnboardingTaskCommand(
            dto.EmployeeId,
            dto.ProcessType,
            dto.TaskName,
            dto.AssignedRole,
            dto.DueDate,
            dto.Notes,
            dto.AssignedToEmployeeId);

        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<EmployeeOnboardingTaskDto>.SuccessResult(result, "Thêm đầu việc mới thành công."));
    }

    /// <summary>
    /// Updates details of an existing onboarding or offboarding task (name, role, due date, status, notes).
    /// </summary>
    [HttpPut("tasks/{taskId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<EmployeeOnboardingTaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTask(
        Guid taskId,
        [FromBody] UpdateOnboardingTaskDto dto,
        CancellationToken cancellationToken)
    {
        var command = new UpdateOnboardingTaskCommand(
            taskId,
            dto.TaskName,
            dto.AssignedRole,
            dto.DueDate,
            dto.Status,
            dto.Notes,
            dto.AssignedToEmployeeId);

        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<EmployeeOnboardingTaskDto>.SuccessResult(result, "Cập nhật đầu việc thành công."));
    }

    /// <summary>
    /// Soft-deletes an onboarding or offboarding task.
    /// </summary>
    [HttpDelete("tasks/{taskId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTask(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var command = new DeleteOnboardingTaskCommand(taskId);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<bool>.SuccessResult(result, "Xóa đầu việc thành công."));
    }

    /// <summary>
    /// Updates the status of an onboarding or offboarding task (e.g. Pending -> Completed).
    /// Automatically tracks completion timestamp and the user ID who signed off.
    /// </summary>
    [HttpPatch("tasks/{taskId:guid}/status")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<EmployeeOnboardingTaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTaskStatus(
        Guid taskId,
        [FromBody] UpdateTaskStatusDto dto,
        CancellationToken cancellationToken)
    {
        var command = new UpdateOnboardingTaskStatusCommand(taskId, dto.Status, dto.Notes);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<EmployeeOnboardingTaskDto>.SuccessResult(result, "Cập nhật trạng thái đầu việc thành công."));
    }
}
