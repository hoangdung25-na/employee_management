namespace EmployeeManagement.Domain.Users.Entities;

/// <summary>
/// Many-to-many join entity linking Users and Roles (dbo.UserRoles).
/// </summary>
public class UserRole
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}

