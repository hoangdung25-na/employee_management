using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.DeleteDecision;

/// <summary>
/// Command to cancel/soft-delete an employee decision record (DELETE /api/decisions/{id:guid}).
/// </summary>
public record DeleteDecisionCommand(Guid Id) : IRequest<bool>;
