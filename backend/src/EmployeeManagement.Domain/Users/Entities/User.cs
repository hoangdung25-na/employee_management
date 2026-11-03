using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;

namespace EmployeeManagement.Domain.Users.Entities;

/// <summary>
/// System account entity for Back-Office HRM & Employee Self-Service (ESS) authentication.
/// Supports 1 - 0..1 optional linkage with an Employee profile (NULL for Root Super Admin).
/// </summary>
public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string SecurityStamp { get; set; } = Guid.NewGuid().ToString();

    // Optional 1 - 0..1 link to Employee profile
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    // Account status & Brute-force protection
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; } = false;
    public DateTime? LockedUntil { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;

    // Session & Refresh Token management
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public bool MustChangePassword { get; set; } = false;

    // Assigned Roles (N-N via UserRoles)
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

