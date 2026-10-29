namespace EmployeeManagement.Domain.Codes.Entities;

/// <summary>
/// Concurrency-safe sequential code generator entity.
/// Uses SQL Server RowVersion (Timestamp) for Optimistic Concurrency Control to prevent race conditions.
/// </summary>
public class CodeSequence
{
    /// <summary>
    /// Sequence key identifier (e.g., "Employee", "Department")
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Last allocated sequential number
    /// </summary>
    public int LastIndex { get; private set; } = 0;

    /// <summary>
    /// SQL Server RowVersion concurrency token
    /// </summary>
    public byte[] RowVersion { get; private set; } = [];

    public CodeSequence() { }

    public CodeSequence(string id, int initialIndex = 0)
    {
        Id = id;
        LastIndex = initialIndex;
    }

    /// <summary>
    /// Increments the sequence index and generates a formatted business code
    /// </summary>
    /// <param name="prefix">Code prefix (e.g., "EMP-")</param>
    /// <param name="digits">Zero-padding length (default 5 digits: 00001)</param>
    public string GenerateNextCode(string prefix, int digits = 5)
    {
        LastIndex += 1;
        return $"{prefix}{LastIndex.ToString().PadLeft(digits, '0')}";
    }
}
