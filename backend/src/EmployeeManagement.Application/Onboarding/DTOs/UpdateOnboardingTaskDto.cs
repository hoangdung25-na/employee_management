namespace EmployeeManagement.Application.Onboarding.DTOs;

/// <summary>
/// Payload DTO for updating an onboarding or offboarding task (PUT /api/onboarding/tasks/{taskId:guid}).
/// </summary>
public record UpdateOnboardingTaskDto(
    string TaskName,
    string AssignedRole,
    DateOnly DueDate,
    string Status,
    string? Notes = null,
    Guid? AssignedToEmployeeId = null
);

