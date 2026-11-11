using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Positions.DTOs;
using EmployeeManagement.Application.Positions.Queries.GetPositions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// Thin RESTful Controller for Job Positions catalog (GET /api/positions).
/// </summary>
[ApiController]
[Route("api/positions")]
[Produces("application/json")]
[Authorize]
public class PositionsController : ControllerBase
{
    private readonly ISender _sender;

    public PositionsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves the catalog of job positions for dropdown selection and organizational reference.
    /// Optionally filtered by departmentId to enforce Department-Position mapping constraints.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PositionResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPositions(
        [FromQuery] bool includeInactive = false,
        [FromQuery] Guid? departmentId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPositionsQuery(includeInactive, departmentId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<PositionResponseDto>>.SuccessResult(result, "Lấy danh mục chức danh thành công."));
    }
}

