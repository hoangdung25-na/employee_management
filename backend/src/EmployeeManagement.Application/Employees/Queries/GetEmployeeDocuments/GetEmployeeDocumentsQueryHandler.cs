using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeDocuments;

/// <summary>
/// Query handler for retrieving all documents attached to an employee.
/// Enforces Row-Level Data Ownership (ESS: employees can only view their own documents).
/// </summary>
public class GetEmployeeDocumentsQueryHandler : IRequestHandler<GetEmployeeDocumentsQuery, IReadOnlyList<EmployeeDocumentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEmployeeDocumentsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<EmployeeDocumentDto>> Handle(
        GetEmployeeDocumentsQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Verify employee exists
        var employeeExists = await _context.Employees
            .AsNoTracking()
            .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (!employeeExists)
        {
            throw new NotFoundException("Nhân viên", request.EmployeeId);
        }

        // 2. Enforce Row-Level Security / ESS Ownership
        if (_currentUserService.IsAuthenticated)
        {
            var hasManagePermission = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                                      _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                                      _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                                      _currentUserService.HasPermission(UserConsts.Permissions.DocumentManage);

            var isOwner = _currentUserService.EmployeeId.HasValue &&
                          _currentUserService.EmployeeId.Value == request.EmployeeId;

            if (!hasManagePermission && !isOwner)
            {
                throw new ForbiddenException("Bạn không có quyền xem tài liệu của nhân sự khác (Vi phạm quyền sở hữu ESS).");
            }
        }

        // 3. Query documents with AsNoTracking and projection
        var documents = await _context.EmployeeDocuments
            .AsNoTracking()
            .Where(d => d.EmployeeId == request.EmployeeId)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new EmployeeDocumentDto(
                d.Id,
                d.EmployeeId,
                d.DocumentType,
                d.DocumentTitle,
                d.FileName,
                d.FileUrl,
                d.FileSizeBytes,
                d.IssueDate,
                d.ExpiryDate,
                d.IsVerified,
                d.UploadedByUserId,
                d.Notes,
                d.CreatedAt))
            .ToListAsync(cancellationToken);

        return documents;
    }
}

