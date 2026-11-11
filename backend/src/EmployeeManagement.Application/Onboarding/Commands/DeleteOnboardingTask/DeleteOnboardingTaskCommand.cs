using MediatR;

namespace EmployeeManagement.Application.Onboarding.Commands.DeleteOnboardingTask;

/// <summary>
/// Command to soft-delete an onboarding or offboarding task.
/// </summary>
public record DeleteOnboardingTaskCommand(Guid TaskId) : IRequest<bool>;

