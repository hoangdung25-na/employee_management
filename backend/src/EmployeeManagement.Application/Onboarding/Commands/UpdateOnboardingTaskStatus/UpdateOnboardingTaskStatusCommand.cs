using EmployeeManagement.Application.Onboarding.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Onboarding.Commands.UpdateOnboardingTaskStatus;

/// <summary>
/// Command to update the completion status of an onboarding or offboarding task.
/// </summary>
public record UpdateOnboardingTaskStatusCommand(
    Guid TaskId,
    string Status,
    string? Notes = null
) : IRequest<EmployeeOnboardingTaskDto>;

