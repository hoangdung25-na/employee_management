using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Departments.Commands.CreateDepartment;
using EmployeeManagement.Application.Departments.Commands.DeleteDepartment;
using EmployeeManagement.Application.Departments.Commands.UpdateDepartment;
using EmployeeManagement.Application.Departments.DTOs;
using EmployeeManagement.Application.Departments.Queries.GetDepartmentById;
using EmployeeManagement.Application.Departments.Queries.GetDepartments;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// Thin RESTful Controller for Organizational Department CRUD operations.
/// Enforces atomic RBAC permissions (Department.View, Department.Create, Department.Update, Department.Delete).
/// </summary>
[ApiController]
[Route("api/departments")]
[Produces("application/json")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly ISender _sender;

    public DepartmentsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves all departments with manager name and active headcount.
    /// </summary>
    [HttpGet]
    [RequirePermission(PermissionNames.Departments.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<DepartmentResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDepartments(
        [FromQuery] GetDepartmentsQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<DepartmentResponseDto>>.SuccessResult(result, "Lấy danh sách phòng ban thành công."));
    }

    /// <summary>
    /// Retrieves detailed information of a specific department by GUID, including affiliated members.
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequirePermission(PermissionNames.Departments.View)]
    [ProducesResponseType(typeof(ApiResponse<DepartmentDetailResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDepartmentById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetDepartmentByIdQuery(id), cancellationToken);
        return Ok(ApiResponse<DepartmentDetailResponseDto>.SuccessResult(result, "Lấy thông tin chi tiết phòng ban thành công."));
    }

    /// <summary>
    /// Creates a new department.
    /// </summary>
    [HttpPost]
    [RequirePermission(PermissionNames.Departments.Create)]
    [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateDepartment(
        [FromBody] CreateDepartmentCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<DepartmentResponseDto>.SuccessResult(result, "Tạo mới phòng ban thành công.");

        return CreatedAtAction(nameof(GetDepartmentById), new { id = result.Id }, response);
    }

    /// <summary>
    /// Updates an existing department by GUID.
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequirePermission(PermissionNames.Departments.Update)]
    [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDepartment(
        Guid id,
        [FromBody] UpdateDepartmentRequestDto dto,
        CancellationToken cancellationToken)
    {
        var command = new UpdateDepartmentCommand(
            id,
            dto.DepartmentName,
            dto.ParentDepartmentId,
            dto.ManagerId,
            dto.Description,
            dto.IsActive);

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<DepartmentResponseDto>.SuccessResult(result, "Cập nhật phòng ban thành công."));
    }

    /// <summary>
    /// Soft-deletes a department by GUID (only if it has no affiliated employees and no child departments).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [RequirePermission(PermissionNames.Departments.Delete)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDepartment(Guid id, CancellationToken cancellationToken)
    {
        await _sender.Send(new DeleteDepartmentCommand(id), cancellationToken);
        return NoContent();
    }
}

