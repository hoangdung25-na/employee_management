namespace EmployeeManagement.Application.Auth.DTOs;

/// <summary>
/// Standardized authentication response payload containing user identity, 5-Role RBAC permissions, and JWT tokens.
/// </summary>
public record AuthResponseDto(
    Guid UserId,
    Guid? EmployeeId,
    string Username,
    string Email,
    string FullName,
    string? AvatarUrl,
    bool MustChangePassword,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt
);

