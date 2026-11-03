using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EmployeeManagement.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace EmployeeManagement.Infrastructure.Identity;

/// <summary>
/// Extracts the current authenticated user's identity, EmployeeId, roles, and permissions from the HTTP context JWT claims.
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
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

    public IReadOnlyList<string> Roles =>
        Principal?
            .FindAll(c => c.Type == JwtTokenGenerator.RoleClaimType || c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList()
        ?? [];

    public IReadOnlyList<string> Permissions =>
        Principal?
            .FindAll(JwtTokenGenerator.PermissionClaimType)
            .Select(c => c.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList()
        ?? [];

    public bool IsInRole(string roleCode)
    {
        return Roles.Contains(roleCode, StringComparer.OrdinalIgnoreCase);
    }

    public bool HasPermission(string permissionCode)
    {
        return Permissions.Contains(permissionCode, StringComparer.OrdinalIgnoreCase);
    }
}

