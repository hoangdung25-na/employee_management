namespace EmployeeManagement.Application.Employees.DTOs;

/// <summary>
/// Data Transfer Object representing an employee's legal or financial decision record.
/// </summary>
public record EmployeeDecisionDto(
    Guid Id,
    string DecisionNumber,
    Guid EmployeeId,
    string EmployeeName,
    string EmployeeCode,
    string DecisionType,
    string Title,
    DateOnly EffectiveDate,
    DateOnly SignDate,
    string? SignerName,
    string? SignerPosition,
    decimal Amount,
    Guid? OldDepartmentId,
    string? OldDepartmentName,
    Guid? NewDepartmentId,
    string? NewDepartmentName,
    Guid? OldPositionId,
    string? OldPositionName,
    Guid? NewPositionId,
    string? NewPositionName,
    decimal? OldSalary,
    decimal? NewSalary,
    string? Reason,
    string? AttachmentUrl,
    string Status,
    DateTime CreatedAt
);
