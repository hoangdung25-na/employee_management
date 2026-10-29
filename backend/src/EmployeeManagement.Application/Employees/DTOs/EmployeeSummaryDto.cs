namespace EmployeeManagement.Application.Employees.DTOs;

/// <summary>
/// Data Transfer Object (DTO) for displaying employee records in the Data Grid.
/// Strictly isolates internal domain entities and sensitive fields.
/// </summary>
public record EmployeeSummaryDto(
    Guid Id,
    string EmployeeCode,
    string FullName,
    DateOnly DateOfBirth,
    string Gender,
    string WorkEmail,
    string? PhoneNumber,
    Guid DepartmentId,
    string DepartmentName,
    Guid PositionId,
    string PositionName,
    string? DirectManagerName,
    decimal BaseSalary,
    string? AvatarUrl,
    DateOnly HireDate,
    string Status
);
