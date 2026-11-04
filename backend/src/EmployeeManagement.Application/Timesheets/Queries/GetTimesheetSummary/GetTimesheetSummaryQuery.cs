using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Timesheets.DTOs;
using EmployeeManagement.Domain.Timesheets.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Timesheets.Queries.GetTimesheetSummary;

public record GetTimesheetSummaryQuery(
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    Guid? EmployeeId = null
) : IRequest<TimesheetSummaryDto>;

public class GetTimesheetSummaryQueryHandler : IRequestHandler<GetTimesheetSummaryQuery, TimesheetSummaryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetTimesheetSummaryQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TimesheetSummaryDto> Handle(
        GetTimesheetSummaryQuery request,
        CancellationToken cancellationToken)
    {
        var canManageAll = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                           _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                           _currentUserService.IsInRole(UserConsts.Roles.HrStaff);

        var myEmpId = _currentUserService.EmployeeId ?? Guid.Empty;

        var query = _context.TimesheetEntries
            .AsNoTracking()
            .AsQueryable();

        if (canManageAll)
        {
            if (request.EmployeeId.HasValue && request.EmployeeId.Value != Guid.Empty)
            {
                query = query.Where(t => t.EmployeeId == request.EmployeeId.Value);
            }
        }
        else
        {
            query = query.Where(t => t.EmployeeId == myEmpId);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(t => t.WorkDate >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(t => t.WorkDate <= request.ToDate.Value);
        }

        var list = await query
            .Select(t => new { t.HoursWorked, t.IsBillable, t.Status })
            .ToListAsync(cancellationToken);

        var summary = new TimesheetSummaryDto
        {
            TotalHours = list.Sum(x => x.HoursWorked),
            BillableHours = list.Where(x => x.IsBillable).Sum(x => x.HoursWorked),
            PendingHours = list.Where(x => x.Status == TimesheetConsts.Status.Submitted).Sum(x => x.HoursWorked),
            ApprovedHours = list.Where(x => x.Status == TimesheetConsts.Status.Approved).Sum(x => x.HoursWorked),
            TotalEntries = list.Count
        };

        return summary;
    }
}

