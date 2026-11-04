using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Leaves.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Commands.CancelLeaveRequest;

/// <summary>
/// Command for an employee to withdraw/cancel their own pending leave application.
/// </summary>
public record CancelLeaveRequestCommand(Guid RequestId) : IRequest<bool>;

public class CancelLeaveRequestCommandHandler : IRequestHandler<CancelLeaveRequestCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CancelLeaveRequestCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        CancelLeaveRequestCommand request,
        CancellationToken cancellationToken)
    {
        var leaveRequest = await _context.LeaveRequests
            .FirstOrDefaultAsync(lr => lr.Id == request.RequestId, cancellationToken);

        if (leaveRequest is null)
        {
            throw new NotFoundException("Đơn xin nghỉ phép", request.RequestId);
        }

        // Ownership or SuperAdmin check
        var isOwner = _currentUserService.EmployeeId.HasValue &&
                      _currentUserService.EmployeeId.Value == leaveRequest.EmployeeId;
        var isSuperAdmin = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin);

        if (!isOwner && !isSuperAdmin)
        {
            throw new ForbiddenException("Bạn chỉ được phép hủy đơn xin nghỉ phép của chính mình.");
        }

        if (leaveRequest.Status != LeaveConsts.LeaveStatuses.Pending)
        {
            throw new BadRequestException("Chỉ có thể hủy đơn xin nghỉ phép đang ở trạng thái 'Chờ duyệt' (Pending).");
        }

        var year = leaveRequest.StartDate.Year;
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(lb => lb.EmployeeId == leaveRequest.EmployeeId &&
                                       lb.LeaveTypeId == leaveRequest.LeaveTypeId &&
                                       lb.LeaveYear == year, cancellationToken);

        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            leaveRequest.Status = LeaveConsts.LeaveStatuses.Cancelled;
            leaveRequest.UpdatedAt = DateTime.UtcNow;

            if (balance != null)
            {
                balance.PendingDays = Math.Max(0, balance.PendingDays - leaveRequest.TotalDays);
                balance.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        });

        return true;
    }
}

