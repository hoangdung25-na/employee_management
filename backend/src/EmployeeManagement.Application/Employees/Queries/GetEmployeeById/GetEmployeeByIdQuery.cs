using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeById;

/// <summary>
/// CQRS Query for retrieving an employee's detailed profile by GUID (GET /api/employees/{id:guid}).
/// </summary>
public record GetEmployeeByIdQuery(Guid Id) : IRequest<EmployeeDetailDto>;

