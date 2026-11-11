using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.Commands.CreateDecision;
using EmployeeManagement.Application.Employees.Commands.DeleteDecision;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Employees.Queries.GetDecisionById;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller managing legal and organizational decisions (Rewards, Discipline, Transfer, Promotion).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DecisionsController : ControllerBase
{
    private readonly ISender _sender;

    public DecisionsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves full details of a specific employee decision.
    /// Accessible by HR roles or the target employee themselves (ESS data ownership).
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDecisionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetDecisionByIdQuery(id), cancellationToken);
        return Ok(ApiResponse<EmployeeDecisionDto>.SuccessResult(result, "Lấy thông tin quyết định nhân sự thành công."));
    }

    /// <summary>
    /// Issues a new official employee decision (Reward, Discipline, Transfer, Promotion).
    /// Automatically updates employee Department, Position, and BaseSalary on Transfer or Promotion.
    /// </summary>
    [HttpPost]
    [RequirePermission(PermissionNames.Decisions.Manage)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDecisionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        [FromBody] CreateDecisionDto dto,
        CancellationToken cancellationToken)
    {
        var effectiveDate = dto.EffectiveDate != default ? dto.EffectiveDate : DateOnly.FromDateTime(DateTime.UtcNow);
        var signDate = dto.SignDate.HasValue && dto.SignDate.Value != default ? dto.SignDate.Value : effectiveDate;

        var command = new CreateDecisionCommand(
            dto.EmployeeId,
            dto.DecisionType,
            dto.Title,
            effectiveDate,
            signDate,
            dto.SignerName,
            dto.SignerPosition,
            dto.Amount,
            dto.NewDepartmentId,
            dto.NewPositionId,
            dto.NewSalary,
            dto.Reason,
            dto.AttachmentUrl,
            dto.DecisionNumber);

        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<EmployeeDecisionDto>.SuccessResult(result, "Ban hành quyết định nhân sự thành công.");

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, response);
    }

    /// <summary>
    /// Cancels or soft-deletes an employee decision record.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [RequirePermission(PermissionNames.Decisions.Manage)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteDecisionCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Hủy bỏ quyết định nhân sự thành công."));
    }
}
