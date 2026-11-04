using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetDecisionById;

/// <summary>
/// Query to retrieve a specific decision record by its ID (GET /api/decisions/{id:guid}).
/// </summary>
public record GetDecisionByIdQuery(Guid Id) : IRequest<EmployeeDecisionDto>;
