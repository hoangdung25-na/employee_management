using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Onboarding.Commands.DeleteOnboardingTask;

/// <summary>
/// Command handler for soft-deleting an onboarding or offboarding task.
/// </summary>
public class DeleteOnboardingTaskCommandHandler : IRequestHandler<DeleteOnboardingTaskCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteOnboardingTaskCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        DeleteOnboardingTaskCommand request,
        CancellationToken cancellationToken)
    {
        var task = await _context.EmployeeOnboardingTasks
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
                throw new ForbiddenException("Bạn không có quyền xóa đầu việc này.");
            }
        }

        task.IsDeleted = true;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

