using EmployeeManagement.Application.Departments.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Departments.Commands.CreateDepartment;

/// <summary>
/// CQRS Command for creating a new organizational Department (POST /api/departments).
/// </summary>
public record CreateDepartmentCommand(
    string DepartmentCode,
    string DepartmentName,
    Guid? ParentDepartmentId,
    Guid? ManagerId,
    string? Description
) : IRequest<DepartmentResponseDto>;

