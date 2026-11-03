using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Onboarding.DTOs;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Onboarding.Commands.UpdateOnboardingTaskStatus;

/// <summary>
/// Command handler for updating onboarding / offboarding task status.
/// Automatically sets CompletedAt and CompletedByUserId when status transitions to Completed.
/// </summary>
public class UpdateOnboardingTaskStatusCommandHandler : IRequestHandler<UpdateOnboardingTaskStatusCommand, EmployeeOnboardingTaskDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateOnboardingTaskStatusCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeOnboardingTaskDto> Handle(
        UpdateOnboardingTaskStatusCommand request,
        CancellationToken cancellationToken)
    {
        var task = await _context.EmployeeOnboardingTasks
            .Include(t => t.Employee)
            .Include(t => t.AssignedToEmployee)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task is null)
        {
            throw new NotFoundException("Đầu việc quy trình", request.TaskId);
        }

        // Enforce permissions: Must have Onboarding.Manage or be the assignee/owner
        if (_currentUserService.IsAuthenticated)
        {
            var canManage = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                            _currentUserService.HasPermission(UserConsts.Permissions.OnboardingManage);

            var isAssignee = _currentUserService.EmployeeId.HasValue &&
                             (_currentUserService.EmployeeId.Value == task.AssignedToEmployeeId ||
                              _currentUserService.EmployeeId.Value == task.EmployeeId);

            if (!canManage && !isAssignee)
            {
                throw new ForbiddenException("Bạn không có quyền cập nhật trạng thái đầu việc này.");
            }
        }

        var newStatus = request.Status.Trim();
        var nowUtc = DateTime.UtcNow;

        if (newStatus == OnboardingConsts.TaskStatuses.Completed)
        {
            task.Status = OnboardingConsts.TaskStatuses.Completed;
            task.CompletedAt = nowUtc;
            task.CompletedByUserId = _currentUserService.UserId;
        }
        else
        {
            task.Status = newStatus;
            task.CompletedAt = null;
            task.CompletedByUserId = null;
        }

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            task.Notes = request.Notes.Trim();
        }

        task.UpdatedAt = nowUtc;

        await _context.SaveChangesAsync(cancellationToken);

        return new EmployeeOnboardingTaskDto(
            task.Id,
            task.EmployeeId,
            task.Employee.FullName,
            task.Employee.EmployeeCode,
            task.ProcessType,
            task.TaskName,
            task.AssignedRole,
            task.AssignedToEmployeeId,
            task.AssignedToEmployee != null ? task.AssignedToEmployee.FullName : null,
            task.DueDate,
            task.Status,
            task.CompletedAt,
            task.CompletedByUserId,
            task.Notes,
            task.CreatedAt);
    }
}
