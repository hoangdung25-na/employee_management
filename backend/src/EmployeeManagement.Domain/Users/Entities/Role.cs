namespace EmployeeManagement.Domain.Users.Entities;

/// <summary>
/// RBAC Role entity representing one of the 5 system roles (SUPER_ADMIN, HR_MANAGER, HR_STAFF, MANAGER, EMPLOYEE).
/// </summary>
public class Role
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RoleCode { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

