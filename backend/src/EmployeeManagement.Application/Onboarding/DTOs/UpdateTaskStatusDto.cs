namespace EmployeeManagement.Application.Onboarding.DTOs;

/// <summary>
/// Payload DTO for updating an onboarding or offboarding task status (PATCH /api/onboarding/tasks/{taskId:guid}/status).
/// </summary>
public record UpdateTaskStatusDto(
    string Status,
    string? Notes
);

