using EmployeeManagement.Application.Onboarding.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Onboarding.Commands.CreateOnboardingTask;

/// <summary>
/// Command to create a new onboarding or offboarding task for an employee.
/// </summary>
public record CreateOnboardingTaskCommand(
    Guid EmployeeId,
    string ProcessType,
    string TaskName,
    string AssignedRole,
    DateOnly DueDate,
    string? Notes = null,
    Guid? AssignedToEmployeeId = null
) : IRequest<EmployeeOnboardingTaskDto>;

