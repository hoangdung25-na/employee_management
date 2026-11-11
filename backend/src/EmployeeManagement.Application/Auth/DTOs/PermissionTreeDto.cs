namespace EmployeeManagement.Application.Auth.DTOs;

/// <summary>
/// Atomic permission node within a functional module.
/// </summary>
public record PermissionNodeDto(
    string Code,
    string DisplayName,
    string? Description = null
);

/// <summary>
/// Functional module grouping containing atomic permission nodes (Permission Tree).
/// </summary>
public record PermissionModuleGroupDto(
    string ModuleCode,
    string ModuleName,
    string? Description,
    IReadOnlyList<PermissionNodeDto> Permissions
);

