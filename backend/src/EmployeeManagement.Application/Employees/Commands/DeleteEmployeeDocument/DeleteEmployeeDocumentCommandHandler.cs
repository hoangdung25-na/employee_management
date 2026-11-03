using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.DeleteEmployeeDocument;

/// <summary>
/// Command handler for soft-deleting an employee document.
/// </summary>
public class DeleteEmployeeDocumentCommandHandler : IRequestHandler<DeleteEmployeeDocumentCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteEmployeeDocumentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(
        DeleteEmployeeDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var document = await _context.EmployeeDocuments
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.EmployeeId == request.EmployeeId, cancellationToken);

        if (document is null)
        {
            throw new NotFoundException("Tài liệu nhân sự", request.DocumentId);
        }

        document.IsDeleted = true;
        document.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

