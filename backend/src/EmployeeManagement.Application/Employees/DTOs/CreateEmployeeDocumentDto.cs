namespace EmployeeManagement.Application.Employees.DTOs;

/// <summary>
/// Payload DTO for uploading/creating an employee document.
/// </summary>
public record CreateEmployeeDocumentDto(
    string DocumentType,
    string DocumentTitle,
    string FileName,
    string FileUrl,
    long FileSizeBytes,
    DateOnly? IssueDate,
    DateOnly? ExpiryDate,
    bool IsVerified,
    string? Notes
);
