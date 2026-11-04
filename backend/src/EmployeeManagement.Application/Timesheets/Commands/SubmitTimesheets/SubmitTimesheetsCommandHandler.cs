using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Timesheets.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Timesheets.Commands.SubmitTimesheets;

public class SubmitTimesheetsCommandHandler : IRequestHandler<SubmitTimesheetsCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SubmitTimesheetsCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<int> Handle(
        SubmitTimesheetsCommand request,
        CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (!employeeId.HasValue || employeeId.Value == Guid.Empty)
        {
            throw new BadRequestException("Tài khoản chưa được liên kết với hồ sơ nhân sự.");
        }

        var query = _context.TimesheetEntries
            .Where(t => t.EmployeeId == employeeId.Value && t.Status == TimesheetConsts.Status.Draft);

        if (request.EntryIds != null && request.EntryIds.Count > 0)
        {
            query = query.Where(t => request.EntryIds.Contains(t.Id));
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(t => t.WorkDate >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(t => t.WorkDate <= request.ToDate.Value);
        }

        var drafts = await query.ToListAsync(cancellationToken);
        if (drafts.Count == 0)
        {
            return 0;
        }

        foreach (var item in drafts)
        {
            item.Status = TimesheetConsts.Status.Submitted;
            item.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return drafts.Count;
    }
}

