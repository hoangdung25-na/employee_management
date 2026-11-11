using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using Microsoft.AspNetCore.Http;

namespace EmployeeManagement.Infrastructure.Identity;

/// <summary>
/// Evaluates atomic permissions for the current user by checking <see cref="IAuthCache"/> in RAM (microseconds)
/// rather than executing SQL JOIN queries on every API request.
/// Automatically grants full access to active users with the <see cref="AppRoles.SuperAdmin"/> role.
/// </summary>
public sealed class PermissionChecker : IPermissionChecker
{
    private readonly IAuthCache _authCache;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PermissionChecker(
        IAuthCache authCache,
        IHttpContextAccessor httpContextAccessor)
    {
        _authCache = authCache;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<bool> IsGrantedAsync(string permissionName, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return false;
        }

        return await IsGrantedAsync(userId.Value, permissionName, cancellationToken);
    }

    public async Task<bool> IsGrantedAsync(Guid userId, string permissionName, CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty || string.IsNullOrWhiteSpace(permissionName))
        {
            return false;
        }

        var authEntry = await _authCache.GetOrSetUserAuthAsync(userId, cancellationToken);
        if (authEntry is null || !authEntry.IsActive)
        {
            return false;
        }

        return authEntry.Permissions.Contains(permissionName);
    }

    public bool IsGranted(Guid userId, string permissionName)
    {
        if (userId == Guid.Empty || string.IsNullOrWhiteSpace(permissionName))
        {
            return false;
        }

        var authEntry = _authCache.GetOrSetUserAuth(userId);
        if (authEntry is null || !authEntry.IsActive)
        {
            return false;
        }

        return authEntry.Permissions.Contains(permissionName);
    }

    private Guid? GetCurrentUserId()
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var userId) ? userId : null;
    }
}

