using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Timesheets.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Timesheets.Commands.DeleteTimesheetEntry;

public class DeleteTimesheetEntryCommandHandler : IRequestHandler<DeleteTimesheetEntryCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteTimesheetEntryCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        DeleteTimesheetEntryCommand request,
        CancellationToken cancellationToken)
    {
        var entry = await _context.TimesheetEntries
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (entry is null)
        {
            throw new NotFoundException("Bản ghi timesheet", request.Id);
        }

        var isOwner = entry.EmployeeId == _currentUserService.EmployeeId;
        var canManage = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                        _currentUserService.IsInRole(UserConsts.Roles.HrManager);

        if (!isOwner && !canManage)
        {
            throw new ForbiddenException("Bạn không có quyền xóa bản ghi timesheet này.");
        }

        if (entry.Status == TimesheetConsts.Status.Approved && !canManage)
        {
            throw new BadRequestException("Bản ghi đã được phê duyệt, chỉ HR Manager hoặc Quản trị viên mới có thể xóa.");
        }

        entry.IsDeleted = true;
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

