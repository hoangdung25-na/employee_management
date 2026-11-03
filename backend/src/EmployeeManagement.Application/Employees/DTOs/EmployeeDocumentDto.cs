namespace EmployeeManagement.Application.Employees.DTOs;

/// <summary>
/// Data Transfer Object representing an employee's digital document.
/// </summary>
public record EmployeeDocumentDto(
    Guid Id,
    Guid EmployeeId,
    string DocumentType,
    string DocumentTitle,
    string FileName,
    string FileUrl,
    long FileSizeBytes,
    DateOnly? IssueDate,
    DateOnly? ExpiryDate,
    bool IsVerified,
    Guid? UploadedByUserId,
    string? Notes,
    DateTime CreatedAt
);

