namespace EmployeeManagement.Domain.Users.Entities;

/// <summary>
/// Immutable security audit log recording every login attempt (successful or failed),
/// including client IP address, User-Agent (browser/device), and failure reason.
/// </summary>
public class LoginAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string UsernameOrEmail { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public string? FailureReason { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Optional navigation property (null when login fails due to unknown UsernameOrEmail)
    public User? User { get; set; }
}

