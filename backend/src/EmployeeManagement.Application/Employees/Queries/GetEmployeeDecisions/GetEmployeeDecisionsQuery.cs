using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeDecisions;

/// <summary>
/// Query to retrieve decision records for an employee (GET /api/employees/{id:guid}/decisions).
/// </summary>
public record GetEmployeeDecisionsQuery(Guid EmployeeId) : IRequest<IReadOnlyList<EmployeeDecisionDto>>;
