namespace EmployeeManagement.Application.Interfaces;

/// <summary>
/// Abstraction for accessing the currently authenticated user's identity, EmployeeId, roles, and permissions.
/// Used across Application handlers to enforce Row-Level Data Ownership (ESS Self-Only / Manager Subordinate-Only) and Salary Privacy.
/// </summary>
public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? EmployeeId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
    IReadOnlyList<string> Permissions { get; }

    bool IsInRole(string roleCode);
    bool HasPermission(string permissionCode);
}

