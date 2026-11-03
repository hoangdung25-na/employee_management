using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Onboarding.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Onboarding.Queries.GetOnboardingTasks;

/// <summary>
/// Query handler for retrieving onboarding and offboarding tasks with multi-criteria filtering and ESS security.
/// </summary>
public class GetOnboardingTasksQueryHandler : IRequestHandler<GetOnboardingTasksQuery, IReadOnlyList<EmployeeOnboardingTaskDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetOnboardingTasksQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<EmployeeOnboardingTaskDto>> Handle(
        GetOnboardingTasksQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.EmployeeOnboardingTasks
            .AsNoTracking()
            .Include(t => t.Employee)
            .Include(t => t.AssignedToEmployee)
            .AsQueryable();

        // 1. Enforce Row-Level Security for ESS Employee role
        if (_currentUserService.IsAuthenticated)
        {
            var canManageAll = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                               _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                               _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                               _currentUserService.HasPermission(UserConsts.Permissions.OnboardingManage);

            if (!canManageAll && _currentUserService.EmployeeId.HasValue)
            {
                var currentEmpId = _currentUserService.EmployeeId.Value;
                query = query.Where(t => t.EmployeeId == currentEmpId || t.AssignedToEmployeeId == currentEmpId);
            }
        }

        // 2. Apply optional filters
        if (request.EmployeeId.HasValue)
        {
            query = query.Where(t => t.EmployeeId == request.EmployeeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.ProcessType))
        {
            var pType = request.ProcessType.Trim();
            query = query.Where(t => t.ProcessType == pType);
        }

        if (!string.IsNullOrWhiteSpace(request.AssignedRole))
        {
            var role = request.AssignedRole.Trim();
            query = query.Where(t => t.AssignedRole == role);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim();
            query = query.Where(t => t.Status == status);
        }

        // 3. Project to DTO ordered by DueDate ascending
        var tasks = await query
            .OrderBy(t => t.DueDate)
            .ThenBy(t => t.CreatedAt)
            .Select(t => new EmployeeOnboardingTaskDto(
                t.Id,
                t.EmployeeId,
                t.Employee.FullName,
                t.Employee.EmployeeCode,
                t.ProcessType,
                t.TaskName,
                t.AssignedRole,
                t.AssignedToEmployeeId,
                t.AssignedToEmployee != null ? t.AssignedToEmployee.FullName : null,
                t.DueDate,
                t.Status,
                t.CompletedAt,
                t.CompletedByUserId,
                t.Notes,
                t.CreatedAt))
            .ToListAsync(cancellationToken);

        return tasks;
    }
}
