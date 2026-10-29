using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;

namespace EmployeeManagement.Domain.Departments.Entities;

/// <summary>
/// Organizational Department entity supporting parent-child hierarchy.
/// </summary>
public class Department : BaseEntity
{
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;

    // Parent-child department hierarchy
    public Guid? ParentDepartmentId { get; set; }
    public Department? ParentDepartment { get; set; }
    public ICollection<Department> SubDepartments { get; set; } = new List<Department>();

    // Department Manager
    public Guid? ManagerId { get; set; }
    public Employee? Manager { get; set; }

    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Affiliated employees
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
