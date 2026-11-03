using EmployeeManagement.Application.Departments.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Departments.Queries.GetDepartmentById;

/// <summary>
/// CQRS Query to retrieve a single department's details and affiliated members by GUID (GET /api/departments/{id:guid}).
/// </summary>
public record GetDepartmentByIdQuery(Guid Id) : IRequest<DepartmentDetailResponseDto>;

