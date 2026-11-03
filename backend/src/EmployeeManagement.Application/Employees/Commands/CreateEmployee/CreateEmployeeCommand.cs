using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployee;

/// <summary>
/// CQRS Command for onboarding / creating a new Employee (POST /api/employees).
/// Automatically generates a sequential EmployeeCode (EMP-xxxxx) via CodeSequences.
/// </summary>
public record CreateEmployeeCommand(
    string FullName,
    DateOnly DateOfBirth,
    string Gender,
    string CitizenId,
    string? PhoneNumber,
    string WorkEmail,
    string? PersonalEmail,
    string? Address,
    DateOnly HireDate,
    Guid DepartmentId,
    Guid PositionId,
    Guid? DirectManagerId,
    decimal BaseSalary,
    string? AvatarUrl = null,
    string Status = "Probation",
    DateOnly? ProbationEndDate = null,
    string? TaxCode = null,
    string? SocialInsuranceNumber = null,
    string? BankAccountNumber = null,
    string? BankName = null
) : IRequest<EmployeeDetailDto>;

