namespace EmployeeManagement.Domain.Users.Entities;

/// <summary>
/// Many-to-many join entity linking Roles and Permissions (dbo.RolePermissions).
/// </summary>
public class RolePermission
{
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public Guid PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}

