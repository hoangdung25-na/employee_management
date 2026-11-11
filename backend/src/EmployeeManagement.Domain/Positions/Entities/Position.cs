using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Departments.Entities;
using EmployeeManagement.Domain.Employees.Entities;

namespace EmployeeManagement.Domain.Positions.Entities;

/// <summary>
/// Job Position / Title entity.
/// Includes JobLevel (1: Executive/BOD, 2: Management/Team Lead, 3: Staff/Individual Contributor).
/// </summary>
public class Position : BaseEntity
{
    public string PositionCode { get; set; } = string.Empty;
    public string PositionName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Hierarchy Level: 1 = C-Level / BOD, 2 = Department Head / Manager / Lead, 3 = Specialist / Staff.
    /// Used for organizational hierarchy validation and manager assignment.
    /// </summary>
    public int JobLevel { get; set; } = 3;

    // Authorized department affiliations
    public ICollection<DepartmentPosition> DepartmentPositions { get; set; } = new List<DepartmentPosition>();

    // Employees holding this position
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
