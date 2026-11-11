using EmployeeManagement.Application.Onboarding.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Onboarding.Commands.UpdateOnboardingTask;

/// <summary>
/// Command to update details of an onboarding or offboarding task.
/// </summary>
public record UpdateOnboardingTaskCommand(
    Guid TaskId,
    string TaskName,
    string AssignedRole,
    DateOnly DueDate,
    string Status,
    string? Notes = null,
    Guid? AssignedToEmployeeId = null
) : IRequest<EmployeeOnboardingTaskDto>;

