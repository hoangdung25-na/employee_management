using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;

namespace EmployeeManagement.Domain.Positions.Entities;

/// <summary>
/// Job Position / Title entity.
/// </summary>
public class Position : BaseEntity
{
    public string PositionCode { get; set; } = string.Empty;
    public string PositionName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Employees holding this position
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
