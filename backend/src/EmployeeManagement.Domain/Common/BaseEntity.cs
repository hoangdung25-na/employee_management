namespace EmployeeManagement.Domain.Common;

/// <summary>
/// Base abstract class for all domain entities.
/// Enforces GUID primary key identification and Soft Delete capability.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Primary key identifier (GUID, generated sequentially by SQL Server via NEWSEQUENTIALID())
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Soft delete flag. True if logically deleted; False if active.
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// Timestamp when the record was created (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the record was last modified (UTC)
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
