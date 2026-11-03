using EmployeeManagement.Application.Common;
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

