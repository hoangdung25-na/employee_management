using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Timesheets.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Timesheets.Queries.GetTimesheets;

/// <summary>
/// Query to retrieve timesheet records with date range, project, status, and role-based data isolation.
/// </summary>
public record GetTimesheetsQuery(
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    Guid? EmployeeId = null,
    string? ProjectCode = null,
    string? Status = null,
    Guid? DepartmentId = null
) : IRequest<IReadOnlyList<TimesheetEntryDto>>;

public class GetTimesheetsQueryHandler : IRequestHandler<GetTimesheetsQuery, IReadOnlyList<TimesheetEntryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetTimesheetsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<TimesheetEntryDto>> Handle(
        GetTimesheetsQuery request,
        CancellationToken cancellationToken)
    {
        var canManageAll = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                           _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                           _currentUserService.IsInRole(UserConsts.Roles.HrStaff);

        var isManager = _currentUserService.IsInRole(UserConsts.Roles.Manager) ||
                        _currentUserService.HasPermission(UserConsts.Permissions.TimesheetApprove);

        var myEmpId = _currentUserService.EmployeeId ?? Guid.Empty;

        // Rule #4: AsNoTracking on 100% read-only queries
        var query = _context.TimesheetEntries
            .AsNoTracking()
            .Include(t => t.Employee)
                .ThenInclude(e => e.Department)
            .Include(t => t.ApprovedByEmployee)
            .AsQueryable();

        // 1. Data Isolation / Scope Filtering (Security Rule #5: Anti-IDOR & ESS Row-level ownership)
        if (canManageAll)
        {
            if (request.EmployeeId.HasValue && request.EmployeeId.Value != Guid.Empty)
            {
                query = query.Where(t => t.EmployeeId == request.EmployeeId.Value);
            }
        }
        else if (isManager)
        {
            // Managers can view their own entries OR entries of employees who report to them or are in their department
            var managedSubordinateIds = await _context.Employees
                .AsNoTracking()
                .Where(e => e.DirectManagerId == myEmpId ||
                            (e.Department != null && e.Department.ManagerId == myEmpId))
                .Select(e => e.Id)
                .ToListAsync(cancellationToken);

            var allowedEmployeeIds = managedSubordinateIds.Append(myEmpId).Distinct().ToList();

            if (request.EmployeeId.HasValue && request.EmployeeId.Value != Guid.Empty)
            {
                if (allowedEmployeeIds.Contains(request.EmployeeId.Value))
                {
                    query = query.Where(t => t.EmployeeId == request.EmployeeId.Value);
                }
                else
                {
                    query = query.Where(t => false);
                }
            }
            else
            {
                query = query.Where(t => allowedEmployeeIds.Contains(t.EmployeeId));
            }
        }
        else
        {
            // Standard Employee can only see their own timesheets
            query = query.Where(t => t.EmployeeId == myEmpId);
        }

        // 2. Additional Filters (Rule #2: SARGable queries using indexed columns)
        if (request.FromDate.HasValue)
        {
            query = query.Where(t => t.WorkDate >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(t => t.WorkDate <= request.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.ProjectCode))
        {
            var pCode = request.ProjectCode.Trim().ToUpperInvariant();
            query = query.Where(t => t.ProjectCode == pCode);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.Status == request.Status);
        }

        if (request.DepartmentId.HasValue && request.DepartmentId.Value != Guid.Empty)
        {
            query = query.Where(t => t.Employee.DepartmentId == request.DepartmentId.Value);
        }

        // 3. Projection to DTO
        var items = await query
            .OrderByDescending(t => t.WorkDate)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TimesheetEntryDto
            {
                Id = t.Id,
                EmployeeId = t.EmployeeId,
                EmployeeCode = t.Employee.EmployeeCode,
                EmployeeFullName = t.Employee.FullName,
                DepartmentName = t.Employee.Department != null ? t.Employee.Department.DepartmentName : string.Empty,
                WorkDate = t.WorkDate,
                ProjectCode = t.ProjectCode,
                ProjectName = t.ProjectName,
                TaskTitle = t.TaskTitle,
                HoursWorked = t.HoursWorked,
                IsBillable = t.IsBillable,
                Description = t.Description,
                Status = t.Status,
                ApprovedByEmployeeId = t.ApprovedByEmployeeId,
                ApproverFullName = t.ApprovedByEmployee != null ? t.ApprovedByEmployee.FullName : null,
                ApprovedAt = t.ApprovedAt,
                RejectionReason = t.RejectionReason,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return items;
    }
}
