using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployeeDocument;

/// <summary>
/// Command handler for creating/uploading an employee document.
/// Automatically records the uploaded user ID and creation timestamp.
/// </summary>
public class CreateEmployeeDocumentCommandHandler : IRequestHandler<CreateEmployeeDocumentCommand, EmployeeDocumentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateEmployeeDocumentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDocumentDto> Handle(
        CreateEmployeeDocumentCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Check if employee exists
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (!employeeExists)
        {
            throw new NotFoundException("Nhân viên", request.EmployeeId);
        }

        // 2. Create document record
        var document = new EmployeeDocument
        {
            Id = Guid.NewGuid(),
            EmployeeId = request.EmployeeId,
            DocumentType = request.DocumentType.Trim(),
            DocumentTitle = request.DocumentTitle.Trim(),
            FileName = request.FileName.Trim(),
            FileUrl = request.FileUrl.Trim(),
            FileSizeBytes = request.FileSizeBytes,
            IssueDate = request.IssueDate,
            ExpiryDate = request.ExpiryDate,
            IsVerified = request.IsVerified,
            UploadedByUserId = _currentUserService.UserId,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.EmployeeDocuments.AddAsync(document, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new EmployeeDocumentDto(
            document.Id,
            document.EmployeeId,
            document.DocumentType,
            document.DocumentTitle,
            document.FileName,
            document.FileUrl,
            document.FileSizeBytes,
            document.IssueDate,
            document.ExpiryDate,
            document.IsVerified,
            document.UploadedByUserId,
            document.Notes,
            document.CreatedAt);
    }
}

