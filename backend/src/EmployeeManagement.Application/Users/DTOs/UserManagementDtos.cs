namespace EmployeeManagement.Application.Users.DTOs;

/// <summary>
/// Summary DTO for displaying a user row in the Back-Office User Management table.
/// </summary>
public record UserSummaryDto(
    Guid Id,
    Guid? EmployeeId,
    string EmployeeCode,
    string Username,
    string FullName,
    string Email,
    string? DepartmentName,
    string? PositionName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> RoleNames,
    IReadOnlyList<string> Permissions,
    bool IsActive,
    bool IsLocked,
    DateTime? LockedUntil,
    bool MustChangePassword,
    DateTime CreatedAt);

/// <summary>
/// Role option DTO for dropdowns and role badges in User Management, including default permissions of the Role.
/// </summary>
public record RoleOptionDto(
    Guid Id,
    string RoleCode,
    string RoleName,
    string? Description,
    IReadOnlyList<string> DefaultPermissions);

/// <summary>
/// Unlinked active employee option DTO for quick selection when creating a new user account.
/// </summary>
public record UnlinkedEmployeeOptionDto(
    Guid EmployeeId,
    string EmployeeCode,
    string FullName,
    string WorkEmail,
    string DepartmentName,
    string PositionName);

/// <summary>
/// Request payload for creating a new user account with optional custom permissions.
/// </summary>
public record CreateUserRequestDto(
    string Username,
    string Email,
    string Password,
    Guid? EmployeeId,
    IReadOnlyList<string> RoleCodes,
    IReadOnlyList<string>? CustomPermissions = null,
    bool IsActive = true,
    bool MustChangePassword = true);

/// <summary>
/// Request payload for updating an existing user account, roles, custom permissions, password reset, and lockout state.
/// </summary>
public record UpdateUserRequestDto(
    string Email,
    Guid? EmployeeId,
    IReadOnlyList<string> RoleCodes,
    IReadOnlyList<string>? CustomPermissions = null,
    string? NewPassword = null,
    bool IsActive = true,
    bool UnlockAccount = false,
    bool MustChangePassword = false);

/// <summary>
/// Request payload for toggling active/suspended status directly on a table row.
/// </summary>
public record ToggleUserStatusRequestDto(
    bool IsActive);
