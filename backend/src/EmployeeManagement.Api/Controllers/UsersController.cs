using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Users.Commands.CreateUser;
using EmployeeManagement.Application.Users.Commands.ToggleUserStatus;
using EmployeeManagement.Application.Users.Commands.UpdateUser;
using EmployeeManagement.Application.Users.DTOs;
using EmployeeManagement.Application.Users.Queries.GetRoleOptions;
using EmployeeManagement.Application.Users.Queries.GetUnlinkedEmployees;
using EmployeeManagement.Application.Users.Queries.GetUsers;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// Thin RESTful Controller for System User Management, RBAC Role Assignment, and Account Suspension.
/// Automatically synchronizes and evicts IAuthCache when user roles or statuses change.
/// </summary>
[ApiController]
[Route("api/users")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly ISender _sender;

    public UsersController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves a paginated list of system user accounts with optional search, role, and status filters.
    /// </summary>
    [HttpGet]
    [RequirePermission(PermissionNames.Users.View)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UserSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] GetUsersQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<UserSummaryDto>>.SuccessResult(result, "Lấy danh sách người dùng thành công."));
    }

    /// <summary>
    /// Retrieves active system roles for User Management dropdowns and filters.
    /// </summary>
    [HttpGet("roles")]
    [RequirePermission(PermissionNames.Users.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RoleOptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoleOptions(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetRoleOptionsQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<RoleOptionDto>>.SuccessResult(result, "Lấy danh sách vai trò thành công."));
    }

    /// <summary>
    /// Retrieves active employees who do not yet have a linked User account.
    /// </summary>
    [HttpGet("unlinked-employees")]
    [RequirePermission(PermissionNames.Users.Create)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UnlinkedEmployeeOptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnlinkedEmployees(
        [FromQuery] Guid? includeEmployeeId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetUnlinkedEmployeesQuery(includeEmployeeId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<UnlinkedEmployeeOptionDto>>.SuccessResult(result, "Lấy danh sách nhân viên chưa có tài khoản thành công."));
    }

    /// <summary>
    /// Creates a new User account, links optional Employee profile, and assigns RBAC roles.
    /// </summary>
    [HttpPost]
    [RequirePermission(PermissionNames.Users.Create)]
    [ProducesResponseType(typeof(ApiResponse<UserSummaryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserRequestDto dto,
        CancellationToken cancellationToken)
    {
        var command = new CreateUserCommand(
            dto.Username,
            dto.Email,
            dto.Password,
            dto.EmployeeId,
            dto.RoleCodes,
            dto.CustomPermissions,
            dto.IsActive,
            dto.MustChangePassword);

        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<UserSummaryDto>.SuccessResult(result, "Tạo tài khoản người dùng mới thành công."));
    }

    /// <summary>
    /// Updates an existing User account, roles, custom permissions, optional password reset, and account unlock.
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequirePermission(PermissionNames.Users.Create)]
    [ProducesResponseType(typeof(ApiResponse<UserSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateUser(
        Guid id,
        [FromBody] UpdateUserRequestDto dto,
        CancellationToken cancellationToken)
    {
        var command = new UpdateUserCommand(
            id,
            dto.Email,
            dto.EmployeeId,
            dto.RoleCodes,
            dto.CustomPermissions,
            dto.NewPassword,
            dto.IsActive,
            dto.UnlockAccount,
            dto.MustChangePassword);

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<UserSummaryDto>.SuccessResult(result, "Cập nhật thông tin tài khoản người dùng thành công."));
    }

    /// <summary>
    /// Toggles a User account between Active (Hoạt động) and Suspended (Đình chỉ).
    /// Immediately revokes session and invalidates AuthCache when suspended.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [RequirePermission(PermissionNames.Users.Create)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleUserStatus(
        Guid id,
        [FromBody] ToggleUserStatusRequestDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ToggleUserStatusCommand(id, dto.IsActive), cancellationToken);
        var message = dto.IsActive
            ? "Đã kích hoạt lại tài khoản người dùng."
            : "Đã đình chỉ tài khoản và thu hồi phiên đăng nhập thành công.";
        return Ok(ApiResponse<bool>.SuccessResult(result, message));
    }
}

