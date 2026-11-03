namespace EmployeeManagement.Application.Employees.DTOs;

/// <summary>
/// Payload DTO for executing/signing a new employee labor contract.
/// </summary>
public record CreateEmployeeContractDto(
    string ContractType,
    DateOnly StartDate,
    DateOnly? EndDate,
    DateOnly? SignedDate,
    decimal ContractSalary,
    decimal Allowances,
    string? FileUrl,
    string? Notes
);
