namespace EmployeeManagement.Application.Onboarding.DTOs;

/// <summary>
/// Payload DTO for creating a new onboarding or offboarding task (POST /api/onboarding/tasks).
/// </summary>
public record CreateOnboardingTaskDto(
    Guid EmployeeId,
    string ProcessType,
    string TaskName,
    string AssignedRole,
    DateOnly DueDate,
    string? Notes = null,
    Guid? AssignedToEmployeeId = null
);

