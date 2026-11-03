using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployeeContract;

/// <summary>
/// Command to create and sign a new labor contract for an employee (POST /api/employees/{id:guid}/contracts).
/// </summary>
public record CreateEmployeeContractCommand(
    Guid EmployeeId,
    string ContractType,
    DateOnly StartDate,
    DateOnly? EndDate,
    DateOnly? SignedDate,
    decimal ContractSalary,
    decimal Allowances,
    string? FileUrl,
    string? Notes
) : IRequest<EmployeeContractDto>;

