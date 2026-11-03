namespace EmployeeManagement.Application.Onboarding.DTOs;

/// <summary>
/// Data Transfer Object representing an individual onboarding or offboarding checklist item.
/// </summary>
public record EmployeeOnboardingTaskDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string EmployeeCode,
    string ProcessType,
    string TaskName,
    string AssignedRole,
    Guid? AssignedToEmployeeId,
    string? AssignedToEmployeeName,
    DateOnly DueDate,
    string Status,
    DateTime? CompletedAt,
    Guid? CompletedByUserId,
    string? Notes,
    DateTime CreatedAt
);

