using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Onboarding.DTOs;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Onboarding.Commands.UpdateOnboardingTask;

/// <summary>
/// Command handler for updating an existing onboarding or offboarding task.
/// </summary>
public class UpdateOnboardingTaskCommandHandler : IRequestHandler<UpdateOnboardingTaskCommand, EmployeeOnboardingTaskDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateOnboardingTaskCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeOnboardingTaskDto> Handle(
        UpdateOnboardingTaskCommand request,
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

        if (_currentUserService.IsAuthenticated)
        {
            var canManage = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                            _currentUserService.HasPermission(UserConsts.Permissions.OnboardingManage);

            if (!canManage)
            {
                throw new ForbiddenException("Bạn không có quyền chỉnh sửa đầu việc này.");
            }
        }

        if (string.IsNullOrWhiteSpace(request.TaskName))
        {
            throw new BadRequestException("Tên đầu việc không được để trống.");
        }

        var assignedRole = string.IsNullOrWhiteSpace(request.AssignedRole)
            ? task.AssignedRole
            : request.AssignedRole.Trim().ToUpperInvariant();

        if (!OnboardingConsts.AssignedRoles.All.Contains(assignedRole))
        {
            throw new BadRequestException("Bộ phận phụ trách không hợp lệ.");
        }

        var newStatus = string.IsNullOrWhiteSpace(request.Status)
            ? task.Status
            : request.Status.Trim();

        if (!OnboardingConsts.TaskStatuses.All.Contains(newStatus))
        {
            throw new BadRequestException("Trạng thái đầu việc không hợp lệ.");
        }

        var nowUtc = DateTime.UtcNow;

        task.TaskName = request.TaskName.Trim();
        task.AssignedRole = assignedRole;
        task.DueDate = request.DueDate;
        task.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        if (request.AssignedToEmployeeId.HasValue)
        {
            task.AssignedToEmployeeId = request.AssignedToEmployeeId.Value;
        }
        else if (assignedRole == OnboardingConsts.AssignedRoles.Employee)
        {
            task.AssignedToEmployeeId = task.EmployeeId;
        }
        else if (assignedRole == OnboardingConsts.AssignedRoles.Manager)
        {
            task.AssignedToEmployeeId = task.Employee.DirectManagerId;
        }
        else
        {
            task.AssignedToEmployeeId = null;
        }

        if (newStatus == OnboardingConsts.TaskStatuses.Completed)
        {
            if (task.Status != OnboardingConsts.TaskStatuses.Completed)
            {
                task.CompletedAt = nowUtc;
                task.CompletedByUserId = _currentUserService.UserId;
            }
            task.Status = OnboardingConsts.TaskStatuses.Completed;
        }
        else
        {
            task.Status = newStatus;
            task.CompletedAt = null;
            task.CompletedByUserId = null;
        }

        task.UpdatedAt = nowUtc;

        await _context.SaveChangesAsync(cancellationToken);

        string? assignedToName = null;
        if (task.AssignedToEmployeeId.HasValue)
        {
            assignedToName = await _context.Employees
                .AsNoTracking()
                .Where(e => e.Id == task.AssignedToEmployeeId.Value)
                .Select(e => e.FullName)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return new EmployeeOnboardingTaskDto(
            task.Id,
            task.EmployeeId,
            task.Employee.FullName,
            task.Employee.EmployeeCode,
            task.ProcessType,
            task.TaskName,
            task.AssignedRole,
            task.AssignedToEmployeeId,
            assignedToName,
            task.DueDate,
            task.Status,
            task.CompletedAt,
            task.CompletedByUserId,
            task.Notes,
            task.CreatedAt);
    }
}

