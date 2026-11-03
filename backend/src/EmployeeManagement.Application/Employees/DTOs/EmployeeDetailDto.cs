namespace EmployeeManagement.Application.Employees.DTOs;

/// <summary>
/// Comprehensive Data Transfer Object for a single employee's full profile (GET /api/employees/{id:guid}).
/// BaseSalary is masked (set to 0) when accessed by roles without salary visibility (e.g., HR_STAFF).
/// </summary>
public record EmployeeDetailDto(
    Guid Id,
    string EmployeeCode,
    string FullName,
    DateOnly DateOfBirth,
    string Gender,
    string CitizenId,
    string? PhoneNumber,
    string WorkEmail,
    string? PersonalEmail,
    string? Address,
    DateOnly HireDate,
    DateOnly? ProbationEndDate,
    Guid DepartmentId,
    string DepartmentName,
    Guid PositionId,
    string PositionName,
    Guid? DirectManagerId,
    string? DirectManagerName,
    decimal BaseSalary,
    string? TaxCode,
    string? SocialInsuranceNumber,
    string? BankAccountNumber,
    string? BankName,
    string? AvatarUrl,
    string Status,
    DateOnly? TerminationDate,
    string? TerminationReason,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

