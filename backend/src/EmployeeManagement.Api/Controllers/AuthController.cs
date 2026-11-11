using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Api.Middlewares;
using EmployeeManagement.Application.Auth.Commands.ChangePassword;
using EmployeeManagement.Application.Auth.Commands.Login;
using EmployeeManagement.Application.Auth.Commands.Logout;
using EmployeeManagement.Application.Auth.Commands.RefreshToken;
using EmployeeManagement.Application.Auth.DTOs;
using EmployeeManagement.Application.Auth.Queries.GetCurrentUser;
using EmployeeManagement.Application.Auth.Queries.GetPermissionTree;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller for Identity, Session Cookies (HttpOnly), Anti-CSRF, and 5-Role RBAC/ESS session management.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;
    private readonly IAuthCache _authCache;

    public AuthController(ISender sender, IAuthCache authCache)
    {
        _sender = sender;
        _authCache = authCache;
    }

    /// <summary>
    /// Authenticates a user by Username or Email and Password, sets HttpOnly Session Cookies
    /// (access_token, refresh_token, XSRF-TOKEN), and returns user profile.
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
        SetAuthCookies(result.AccessToken, result.RefreshToken);
        return Ok(ApiResponse<AuthResponseDto>.SuccessResult(result, "Đăng nhập thành công."));
    }

    /// <summary>
    /// Issues a new JWT Access Token and Refresh Token pair with Sliding Expiration (3 hours).
    /// Can read tokens directly from HttpOnly Cookies or optional JSON body.
    /// </summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] RefreshTokenCommand? command, CancellationToken cancellationToken)
    {
        var accessToken = command?.AccessToken;
        if (string.IsNullOrWhiteSpace(accessToken) && Request.Cookies.TryGetValue("access_token", out var cookieAccess))
        {
            accessToken = cookieAccess;
        }

        var refreshToken = command?.RefreshToken;
        if (string.IsNullOrWhiteSpace(refreshToken) && Request.Cookies.TryGetValue("refresh_token", out var cookieRefresh))
        {
            refreshToken = cookieRefresh;
        }

        var resolvedCommand = new RefreshTokenCommand(accessToken ?? string.Empty, refreshToken ?? string.Empty);
        var result = await _sender.Send(resolvedCommand, cancellationToken);
        SetAuthCookies(result.AccessToken, result.RefreshToken);
        return Ok(ApiResponse<AuthResponseDto>.SuccessResult(result, "Làm mới phiên đăng nhập thành công."));
    }

    /// <summary>
    /// Revokes active session, clears HttpOnly Session Cookies, and revokes RefreshToken in DB.
    /// </summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await _sender.Send(new LogoutCommand(), cancellationToken);
        ClearAuthCookies();
        return Ok(ApiResponse<bool>.SuccessResult(true, "Đăng xuất thành công."));
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

    /// <summary>
    /// Retrieves the complete hierarchical system permission tree with Vietnamese labels.
    /// Used by Back-Office Admin screens to assign dynamic role/user permissions.
    /// </summary>
    [HttpGet("permissions-tree")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PermissionModuleGroupDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPermissionTree(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetPermissionTreeQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<PermissionModuleGroupDto>>.SuccessResult(result, "Lấy danh mục cây phân quyền thành công."));
    }

    /// <summary>
    /// Invalidates the cached roles and atomic permissions of a specific user in <see cref="IAuthCache"/>.
    /// Called automatically or by Admin when updating/revoking employee permissions so changes take effect immediately.
    /// </summary>
    [HttpPost("invalidate-cache/{userId:guid}")]
    [RequirePermission(PermissionNames.Users.Create)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public IActionResult InvalidateUserAuthCache([FromRoute] Guid userId)
    {
        _authCache.InvalidateUser(userId);
        return Ok(ApiResponse<bool>.SuccessResult(true, "Đã xóa bộ nhớ đệm phân quyền (AuthCache) của người dùng thành công. Quyền mới có hiệu lực ngay lập tức."));
    }

    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        var isHttps = Request.IsHttps;

        // 1. access_token: HttpOnly = true, SameSite = Lax, Secure = isHttps, Session Cookie (NO Expires/MaxAge)
        var accessCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/"
            // Leaving Expires and MaxAge null designates it as a Browser Session Cookie.
            // When the browser is closed or machine shut down, the browser purges it completely.
        };
        Response.Cookies.Append("access_token", accessToken, accessCookieOptions);

        // 2. refresh_token: HttpOnly = true, SameSite = Lax, Secure = isHttps, Session Cookie (NO Expires/MaxAge)
        var refreshCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        };
        Response.Cookies.Append("refresh_token", refreshToken, refreshCookieOptions);

        // 3. XSRF-TOKEN: HttpOnly = false (accessible by JavaScript to read and attach as X-XSRF-TOKEN header)
        var xsrfToken = Guid.NewGuid().ToString("N");
        var xsrfCookieOptions = new CookieOptions
        {
            HttpOnly = false,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        };
        Response.Cookies.Append(CsrfProtectionMiddleware.XsrfCookieName, xsrfToken, xsrfCookieOptions);
    }

    private void ClearAuthCookies()
    {
        var isHttps = Request.IsHttps;
        var expiredOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        };
        Response.Cookies.Append("access_token", string.Empty, expiredOptions);
        Response.Cookies.Append("refresh_token", string.Empty, expiredOptions);

        var xsrfExpiredOptions = new CookieOptions
        {
            HttpOnly = false,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        };
        Response.Cookies.Append(CsrfProtectionMiddleware.XsrfCookieName, string.Empty, xsrfExpiredOptions);
    }
}
