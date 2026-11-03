using EmployeeManagement.Application.Departments.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Departments.Commands.UpdateDepartment;

/// <summary>
/// Request body DTO for updating a department (DepartmentCode is immutable).
/// </summary>
public record UpdateDepartmentRequestDto(
    string DepartmentName,
    Guid? ParentDepartmentId,
    Guid? ManagerId,
    string? Description,
    bool IsActive = true
);

/// <summary>
/// CQRS Command for updating an existing department (PUT /api/departments/{id:guid}).
/// </summary>
public record UpdateDepartmentCommand(
    Guid Id,
    string DepartmentName,
    Guid? ParentDepartmentId,
    Guid? ManagerId,
    string? Description,
    bool IsActive
) : IRequest<DepartmentResponseDto>;

