namespace EmployeeManagement.Domain.Users.Entities;

/// <summary>
/// Atomic functional permission entity (e.g., Department.Create, Employee.ViewSelf, Leave.Approve).
/// </summary>
public class Permission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

