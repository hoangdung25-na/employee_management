using EmployeeManagement.Application.Departments.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Departments.Queries.GetDepartments;

/// <summary>
/// CQRS Query to retrieve all departments with optional keyword search and inactive inclusion (GET /api/departments).
/// </summary>
public record GetDepartmentsQuery(
    string? Keyword = null,
    bool IncludeInactive = false
) : IRequest<IReadOnlyList<DepartmentResponseDto>>;

