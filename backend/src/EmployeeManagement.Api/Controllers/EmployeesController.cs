using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.Commands.CreateEmployee;
using EmployeeManagement.Application.Employees.Commands.TerminateEmployee;
using EmployeeManagement.Application.Employees.Commands.UpdateEmployee;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Employees.Queries.GetEmployeeById;
using EmployeeManagement.Application.Employees.Queries.GetEmployees;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// Thin RESTful Controller for Core Employee HRM & ESS Profile operations.
/// Enforces 5-Role RBAC policies, Row-Level Data Ownership (ESS Self-Only), and Salary Privacy.
/// </summary>
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
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EmployeeSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] GetEmployeesQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<EmployeeSummaryDto>>.SuccessResult(result, "Lấy danh sách nhân viên thành công."));
    }

    /// <summary>
    /// Retrieves the full profile of a single employee by GUID.
    /// Enforces Row-Level Data Ownership for EMPLOYEE role and masks BaseSalary for HR_STAFF.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeeById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetEmployeeByIdQuery(id), cancellationToken);
        return Ok(ApiResponse<EmployeeDetailDto>.SuccessResult(result, "Lấy thông tin chi tiết nhân viên thành công."));
    }

    /// <summary>
    /// Onboards a new employee and automatically generates a sequential EmployeeCode (EMP-xxxxx).
    /// </summary>
    [HttpPost]
    [Authorize(Policy = UserConsts.Permissions.EmployeeCreate)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateEmployee(
        [FromBody] CreateEmployeeCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<EmployeeDetailDto>.SuccessResult(result, "Tiếp nhận nhân viên mới thành công.");

        return CreatedAtAction(nameof(GetEmployeeById), new { id = result.Id }, response);
    }

    /// <summary>
    /// Updates an existing employee's profile and compensation by GUID.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = UserConsts.Permissions.EmployeeUpdate)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateEmployee(
        Guid id,
        [FromBody] UpdateEmployeeRequestDto dto,
        CancellationToken cancellationToken)
    {
        var command = new UpdateEmployeeCommand(
            id,
            dto.FullName,
            dto.DateOfBirth,
            dto.Gender,
            dto.PhoneNumber,
            dto.PersonalEmail,
            dto.Address,
            dto.DepartmentId,
            dto.PositionId,
            dto.DirectManagerId,
            dto.BaseSalary,
            dto.AvatarUrl,
            dto.Status,
            dto.CitizenId,
            dto.HireDate,
            dto.ProbationEndDate,
            dto.TaxCode,
            dto.SocialInsuranceNumber,
            dto.BankAccountNumber,
            dto.BankName);

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<EmployeeDetailDto>.SuccessResult(result, "Cập nhật hồ sơ nhân viên thành công."));
    }

    /// <summary>
    /// Executes the employee termination (offboarding) procedure, unassigning department leadership
    /// and immediately deactivating the linked User account.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = UserConsts.Permissions.EmployeeTerminate)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TerminateEmployee(
        Guid id,
        [FromBody] TerminateEmployeeRequestDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new TerminateEmployeeCommand(id, dto.TerminationDate, dto.TerminationReason),
            cancellationToken);

        return Ok(ApiResponse<bool>.SuccessResult(result, "Thực hiện thủ tục thôi việc và thu hồi quyền truy cập thành công."));
    }
}
