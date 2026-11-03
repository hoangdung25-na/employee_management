using EmployeeManagement.Application.Auth.Commands.ChangePassword;
using EmployeeManagement.Application.Auth.Commands.Login;
using EmployeeManagement.Application.Auth.Commands.RefreshToken;
using EmployeeManagement.Application.Auth.DTOs;
using EmployeeManagement.Application.Auth.Queries.GetCurrentUser;
using EmployeeManagement.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// Thin RESTful Controller for Identity, Authentication (JWT + Refresh Token), and 5-Role RBAC/ESS session management.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;

    public AuthController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Authenticates a user by Username or Email and Password, returning a JWT Access Token and Refresh Token.
    /// Protected by strict per-IP Rate Limiting and 5-attempt Brute-force lockout.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(DependencyInjection.AuthLoginRateLimitPolicyName)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.SuccessResult(result, "Đăng nhập thành công."));
    }

    /// <summary>
    /// Issues a new JWT Access Token and Refresh Token pair when the current Access Token has expired.
    /// </summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.SuccessResult(result, "Làm mới phiên đăng nhập thành công."));
    }

    /// <summary>
    /// Changes the current authenticated user's password and rotates their SecurityStamp.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Đổi mật khẩu thành công."));
    }

    /// <summary>
    /// Retrieves the currently authenticated user's profile, linked Employee info, Roles, and Permissions.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetCurrentUserQuery(), cancellationToken);
        return Ok(ApiResponse<CurrentUserDto>.SuccessResult(result, "Lấy thông tin người dùng hiện tại thành công."));
    }
}

