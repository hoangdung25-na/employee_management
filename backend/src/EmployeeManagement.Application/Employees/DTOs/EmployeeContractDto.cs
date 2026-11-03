namespace EmployeeManagement.Application.Employees.DTOs;

/// <summary>
/// Data Transfer Object representing an employee's labor contract record.
/// </summary>
public record EmployeeContractDto(
    Guid Id,
    string ContractNumber,
    Guid EmployeeId,
    string ContractType,
    DateOnly StartDate,
    DateOnly? EndDate,
    DateOnly? SignedDate,
    decimal ContractSalary,
    decimal Allowances,
    string? FileUrl,
    string Status,
    string? Notes,
    DateTime CreatedAt
);

