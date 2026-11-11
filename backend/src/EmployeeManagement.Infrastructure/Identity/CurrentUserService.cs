using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using Microsoft.AspNetCore.Http;

namespace EmployeeManagement.Infrastructure.Identity;

/// <summary>
/// Extracts the current authenticated user's identity and EmployeeId from the HTTP context JWT claims,
/// and resolves live Roles and atomic Permissions directly from <see cref="IAuthCache"/> / <see cref="IPermissionChecker"/>
/// to ensure instant permission revocation without querying the database repeatedly.
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IAuthCache _authCache;
    private readonly IPermissionChecker _permissionChecker;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor,
        IAuthCache authCache,
        IPermissionChecker permissionChecker)
    {
        _httpContextAccessor = httpContextAccessor;
        _authCache = authCache;
        _permissionChecker = permissionChecker;
    }

    private ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public Guid? UserId
    {
        get
        {
            var sub = Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                      ?? Principal?.FindFirstValue(ClaimTypes.NameIdentifier);

            return Guid.TryParse(sub, out var userId) ? userId : null;
        }
    }

    public Guid? EmployeeId
    {
        get
        {
            var empId = Principal?.FindFirstValue(JwtTokenGenerator.EmployeeIdClaimType);
            return Guid.TryParse(empId, out var employeeId) ? employeeId : null;
        }
    }

    public string? Email =>
        Principal?.FindFirstValue(JwtRegisteredClaimNames.Email)
        ?? Principal?.FindFirstValue(ClaimTypes.Email);

    private UserAuthCacheEntry? CachedAuth =>
        IsAuthenticated && UserId.HasValue
            ? _authCache.GetOrSetUserAuth(UserId.Value)
            : null;

    public IReadOnlyList<string> Roles
    {
        get
        {
            var auth = CachedAuth;
            if (auth is not null)
            {
                return auth.IsActive ? auth.Roles.ToList() : [];
            }

            return Principal?
                .FindAll(c => c.Type == JwtTokenGenerator.RoleClaimType || c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList()
            ?? [];
        }
    }

    public IReadOnlyList<string> Permissions
    {
        get
        {
            var auth = CachedAuth;
            if (auth is not null)
            {
                return auth.IsActive ? auth.Permissions.ToList() : [];
            }

            return Principal?
                .FindAll(JwtTokenGenerator.PermissionClaimType)
                .Select(c => c.Value)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList()
            ?? [];
        }
    }

    public bool IsInRole(string roleCode)
    {
        var auth = CachedAuth;
        if (auth is not null)
        {
            return auth.IsActive && auth.Roles.Contains(roleCode);
        }

        return Roles.Contains(roleCode, StringComparer.OrdinalIgnoreCase);
    }

    public bool HasPermission(string permissionCode)
    {
        if (IsAuthenticated && UserId.HasValue)
        {
            return _permissionChecker.IsGranted(UserId.Value, permissionCode);
        }

        return Permissions.Contains(permissionCode, StringComparer.OrdinalIgnoreCase)
               || IsInRole(AppRoles.SuperAdmin);
    }
}

