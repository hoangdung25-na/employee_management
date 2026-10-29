using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Employees.Queries.GetEmployees;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmployeesController : ControllerBase
{
    private readonly ISender _sender;

    public EmployeesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves a paginated list of employees with optional search, department, and status filtering.
    /// </summary>
    /// <param name="query">CQRS query parameters for filtering, sorting, and pagination</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EmployeeSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployees([FromQuery] GetEmployeesQuery query, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(query, cancellationToken);
        var response = ApiResponse<PagedResult<EmployeeSummaryDto>>.SuccessResult(result, "Employees retrieved successfully.");

        return Ok(response);
    }
}
