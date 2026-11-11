using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagement.Api.Authorization;

/// <summary>
/// Custom Authorize attribute that enforces atomic RBAC permission checks via <see cref="PermissionAuthorizationHandler"/>
/// and <see cref="EmployeeManagement.Application.Interfaces.IPermissionChecker"/> (backed by <see cref="EmployeeManagement.Application.Interfaces.IAuthCache"/>).
/// Example usage: <c>[RequirePermission(PermissionNames.Employees.Create)]</c>
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
public sealed class RequirePermissionAttribute : AuthorizeAttribute
{
    public string PermissionName { get; }

    public RequirePermissionAttribute(string permissionName)
        : base(policy: permissionName)
    {
        PermissionName = permissionName;
    }
}

