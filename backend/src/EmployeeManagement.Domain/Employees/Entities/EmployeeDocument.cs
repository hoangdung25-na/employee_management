using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Users.Entities;

namespace EmployeeManagement.Domain.Employees.Entities;

/// <summary>
/// Digital document attached to an employee profile (e.g. CV, Degree, Certificate, Medical).
/// </summary>
public class EmployeeDocument : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public string DocumentType { get; set; } = string.Empty;
    public string DocumentTitle { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    public DateOnly? IssueDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public bool IsVerified { get; set; }

    public Guid? UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }

    public string? Notes { get; set; }
}
