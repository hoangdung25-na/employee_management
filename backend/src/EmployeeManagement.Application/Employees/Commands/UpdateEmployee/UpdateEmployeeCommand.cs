using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.UpdateEmployee;

/// <summary>
/// Request body DTO for updating an employee's profile (EmployeeCode and WorkEmail are immutable).
/// </summary>
public record UpdateEmployeeRequestDto(
    string FullName,
    DateOnly DateOfBirth,
    string Gender,
    string? PhoneNumber,
    string? PersonalEmail,
    string? Address,
    Guid DepartmentId,
    Guid PositionId,
    Guid? DirectManagerId,
    decimal BaseSalary,
    string? AvatarUrl,
    string Status,
    string? CitizenId = null,
    DateOnly? HireDate = null,
    DateOnly? ProbationEndDate = null,
    string? TaxCode = null,
    string? SocialInsuranceNumber = null,
    string? BankAccountNumber = null,
    string? BankName = null
);

/// <summary>
/// CQRS Command for updating an Employee's profile and compensation (PUT /api/employees/{id:guid}).
/// </summary>
public record UpdateEmployeeCommand(
    Guid Id,
    string FullName,
    DateOnly DateOfBirth,
    string Gender,
    string? PhoneNumber,
    string? PersonalEmail,
    string? Address,
    Guid DepartmentId,
    Guid PositionId,
    Guid? DirectManagerId,
    decimal BaseSalary,
    string? AvatarUrl,
    string Status,
    string? CitizenId = null,
    DateOnly? HireDate = null,
    DateOnly? ProbationEndDate = null,
    string? TaxCode = null,
    string? SocialInsuranceNumber = null,
    string? BankAccountNumber = null,
    string? BankName = null
) : IRequest<EmployeeDetailDto>;

