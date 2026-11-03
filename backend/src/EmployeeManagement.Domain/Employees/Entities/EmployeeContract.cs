using EmployeeManagement.Domain.Common;

namespace EmployeeManagement.Domain.Employees.Entities;

/// <summary>
/// Labor contract entity representing the employment agreement history for an employee.
/// </summary>
public class EmployeeContract : BaseEntity
{
    public string ContractNumber { get; set; } = string.Empty;

    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public string ContractType { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DateOnly? SignedDate { get; set; }

    public decimal ContractSalary { get; set; }
    public decimal Allowances { get; set; }
    public string? FileUrl { get; set; }

    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }
}

