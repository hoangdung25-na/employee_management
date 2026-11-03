namespace EmployeeManagement.Application.Departments.DTOs;

/// <summary>
/// Summary of an employee affiliated with a department.
/// </summary>
public record DepartmentMemberDto(
    Guid Id,
    string EmployeeCode,
    string FullName,
    string WorkEmail,
    string PositionName,
    string? AvatarUrl,
    string Status
);

/// <summary>
/// Detailed Department response including affiliated active/probation members.
/// </summary>
public record DepartmentDetailResponseDto(
    Guid Id,
    string DepartmentCode,
    string DepartmentName,
    Guid? ParentDepartmentId,
    string? ParentDepartmentName,
    Guid? ManagerId,
    string? ManagerName,
    int EmployeeCount,
    bool IsActive,
    string? Description,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<DepartmentMemberDto> Members
);

