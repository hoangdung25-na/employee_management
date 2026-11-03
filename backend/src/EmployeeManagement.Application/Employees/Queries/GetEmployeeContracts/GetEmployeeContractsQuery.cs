using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeContracts;

/// <summary>
/// Query to retrieve employment contracts history for an employee (GET /api/employees/{id:guid}/contracts).
/// </summary>
public record GetEmployeeContractsQuery(Guid EmployeeId) : IRequest<IReadOnlyList<EmployeeContractDto>>;

