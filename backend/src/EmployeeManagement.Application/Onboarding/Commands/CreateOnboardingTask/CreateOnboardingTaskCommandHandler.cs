using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Onboarding.DTOs;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Onboarding.Commands.CreateOnboardingTask;

/// <summary>
/// Command handler for creating a new onboarding or offboarding task.
/// </summary>
public class CreateOnboardingTaskCommandHandler : IRequestHandler<CreateOnboardingTaskCommand, EmployeeOnboardingTaskDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateOnboardingTaskCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeOnboardingTaskDto> Handle(
        CreateOnboardingTaskCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUserService.IsAuthenticated)
        {
            var canManage = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                            _currentUserService.HasPermission(UserConsts.Permissions.OnboardingManage);

            if (!canManage)
            {
                throw new ForbiddenException("Bạn không có quyền thêm mới đầu việc quy trình.");
            }
        }

        if (string.IsNullOrWhiteSpace(request.TaskName))
        {
            throw new BadRequestException("Tên đầu việc không được để trống.");
        }

        var employee = await _context.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân sự", request.EmployeeId);
        }

        var processType = string.IsNullOrWhiteSpace(request.ProcessType)
            ? OnboardingConsts.ProcessTypes.Onboarding
            : request.ProcessType.Trim();

        if (!OnboardingConsts.ProcessTypes.All.Contains(processType))
        {
            throw new BadRequestException("Loại quy trình không hợp lệ (chỉ chấp nhận Onboarding hoặc Offboarding).");
        }

        var assignedRole = string.IsNullOrWhiteSpace(request.AssignedRole)
            ? OnboardingConsts.AssignedRoles.HR
            : request.AssignedRole.Trim().ToUpperInvariant();

        if (!OnboardingConsts.AssignedRoles.All.Contains(assignedRole))
        {
            throw new BadRequestException("Bộ phận phụ trách không hợp lệ.");
        }

        Guid? assignedToId = request.AssignedToEmployeeId;
        if (!assignedToId.HasValue)
        {
            if (assignedRole == OnboardingConsts.AssignedRoles.Employee)
            {
                assignedToId = employee.Id;
            }
            else if (assignedRole == OnboardingConsts.AssignedRoles.Manager)
            {
                assignedToId = employee.DirectManagerId;
            }
        }

        string? assignedToName = null;
        if (assignedToId.HasValue)
        {
            assignedToName = await _context.Employees
                .AsNoTracking()
                .Where(e => e.Id == assignedToId.Value)
                .Select(e => e.FullName)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var nowUtc = DateTime.UtcNow;
        var task = new EmployeeOnboardingTask
        {
            Id = Guid.NewGuid(),
            EmployeeId = employee.Id,
            ProcessType = processType,
            TaskName = request.TaskName.Trim(),
            AssignedRole = assignedRole,
            AssignedToEmployeeId = assignedToId,
            DueDate = request.DueDate,
            Status = OnboardingConsts.TaskStatuses.Pending,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            IsDeleted = false,
            CreatedAt = nowUtc
        };

        await _context.EmployeeOnboardingTasks.AddAsync(task, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new EmployeeOnboardingTaskDto(
            task.Id,
            task.EmployeeId,
            employee.FullName,
            employee.EmployeeCode,
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

