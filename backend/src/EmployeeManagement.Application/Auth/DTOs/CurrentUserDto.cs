namespace EmployeeManagement.Application.Auth.DTOs;

/// <summary>
/// Profile and permission summary of the currently authenticated user (GET /api/auth/me).
/// </summary>
public record CurrentUserDto(
    Guid UserId,
    Guid? EmployeeId,
    string Username,
    string Email,
    string FullName,
    string? DepartmentName,
    string? PositionName,
    string? AvatarUrl,
    bool MustChangePassword,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions
);

