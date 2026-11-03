using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployeeDocument;

/// <summary>
/// Command to create/upload an employee digital document (POST /api/employees/{id:guid}/documents).
/// </summary>
public record CreateEmployeeDocumentCommand(
    Guid EmployeeId,
    string DocumentType,
    string DocumentTitle,
    string FileName,
    string FileUrl,
    long FileSizeBytes,
    DateOnly? IssueDate,
    DateOnly? ExpiryDate,
    bool IsVerified,
    string? Notes
) : IRequest<EmployeeDocumentDto>;
