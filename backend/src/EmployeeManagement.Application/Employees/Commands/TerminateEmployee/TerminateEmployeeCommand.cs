using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.TerminateEmployee;

/// <summary>
/// Request body DTO for terminating an employee (DELETE /api/employees/{id:guid}).
/// </summary>
public record TerminateEmployeeRequestDto(
    DateOnly TerminationDate,
    string TerminationReason
);

/// <summary>
/// CQRS Command for executing the employee offboarding / termination workflow.
/// </summary>
public record TerminateEmployeeCommand(
    Guid Id,
    DateOnly TerminationDate,
    string TerminationReason
) : IRequest<bool>;

