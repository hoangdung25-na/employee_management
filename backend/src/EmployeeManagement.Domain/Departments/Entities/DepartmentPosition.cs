using EmployeeManagement.Domain.Positions.Entities;

namespace EmployeeManagement.Domain.Departments.Entities;

/// <summary>
/// Join entity for Department to Position many-to-many relationship (Department-Position mapping).
/// Defines which job titles are authorized/valid within each organizational department.
/// </summary>
public class DepartmentPosition
{
    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public Guid PositionId { get; set; }
    public Position Position { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

