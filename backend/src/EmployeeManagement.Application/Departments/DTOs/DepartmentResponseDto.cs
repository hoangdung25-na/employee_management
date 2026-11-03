namespace EmployeeManagement.Application.Departments.DTOs;

/// <summary>
/// Data Transfer Object representing a Department with parent hierarchy, manager info, and active headcount.
/// </summary>
public record DepartmentResponseDto(
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
    DateTime CreatedAt
);

