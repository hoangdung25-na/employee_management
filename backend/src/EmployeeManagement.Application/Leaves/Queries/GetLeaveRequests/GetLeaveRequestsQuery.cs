using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Leaves.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Queries.GetLeaveRequests;

/// <summary>
/// Query to retrieve leave requests with filtering and ESS data ownership.
/// </summary>
public record GetLeaveRequestsQuery(
    string? Status = null,
    int? Year = null,
    int? Month = null,
    Guid? EmployeeId = null
) : IRequest<IReadOnlyList<LeaveRequestDto>>;

public class GetLeaveRequestsQueryHandler : IRequestHandler<GetLeaveRequestsQuery, IReadOnlyList<LeaveRequestDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetLeaveRequestsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<LeaveRequestDto>> Handle(
        GetLeaveRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var canManageAll = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                           _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                           _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                           _currentUserService.HasPermission(UserConsts.Permissions.LeaveApprove);

        var query = _context.LeaveRequests
            .AsNoTracking()
            .Include(lr => lr.Employee)
                .ThenInclude(e => e.Department)
            .Include(lr => lr.LeaveType)
            .Include(lr => lr.ReviewedByEmployee)
            .AsQueryable();

        // Enforce ESS data ownership
        if (!canManageAll)
        {
            var myEmpId = _currentUserService.EmployeeId ?? Guid.Empty;
            query = query.Where(lr => lr.EmployeeId == myEmpId);
        }
        else if (request.EmployeeId.HasValue && request.EmployeeId.Value != Guid.Empty)
        {
            query = query.Where(lr => lr.EmployeeId == request.EmployeeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(lr => lr.Status == request.Status);
        }

        if (request.Year.HasValue)
        {
            query = query.Where(lr => lr.StartDate.Year == request.Year.Value || lr.EndDate.Year == request.Year.Value);
        }

        if (request.Month.HasValue)
        {
            query = query.Where(lr => lr.StartDate.Month == request.Month.Value || lr.EndDate.Month == request.Month.Value);
        }

        var items = await query
            .OrderByDescending(lr => lr.CreatedAt)
            .Select(lr => new LeaveRequestDto(
                lr.Id,
                lr.RequestCode,
                lr.EmployeeId,
                lr.Employee.FullName,
                lr.Employee.EmployeeCode,
                lr.Employee.Department != null ? lr.Employee.Department.DepartmentName : null,
                lr.LeaveType.Id,
                lr.LeaveType.LeaveTypeCode,
                lr.LeaveType.LeaveTypeName,
                lr.LeaveType.IsPaid,
                lr.StartDate,
                lr.EndDate,
                lr.TotalDays,
                lr.Reason,
                lr.AttachmentUrl,
                lr.Status,
                lr.ReviewedByEmployeeId,
                lr.ReviewedByEmployee != null ? lr.ReviewedByEmployee.FullName : null,
                lr.ReviewedAt,
                lr.ReviewComment,
                lr.CreatedAt))
            .ToListAsync(cancellationToken);

        return items;
    }
}

