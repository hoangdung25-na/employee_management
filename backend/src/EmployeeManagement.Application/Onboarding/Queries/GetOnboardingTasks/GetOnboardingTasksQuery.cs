using EmployeeManagement.Application.Onboarding.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Onboarding.Queries.GetOnboardingTasks;

/// <summary>
/// Query to retrieve and filter onboarding and offboarding tasks (GET /api/onboarding/tasks).
/// </summary>
public record GetOnboardingTasksQuery(
    Guid? EmployeeId = null,
    string? ProcessType = null,
    string? AssignedRole = null,
    string? Status = null
) : IRequest<IReadOnlyList<EmployeeOnboardingTaskDto>>;
