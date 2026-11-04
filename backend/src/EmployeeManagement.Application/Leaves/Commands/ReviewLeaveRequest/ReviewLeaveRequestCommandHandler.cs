using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Leaves.DTOs;
using EmployeeManagement.Domain.Leaves.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Commands.ReviewLeaveRequest;

/// <summary>
/// Command handler for approving or rejecting a leave application:
/// - If Approved: Moves PendingDays -> UsedDays in LeaveBalance.
/// - If Rejected: Releases PendingDays back to available quota.
/// - Records reviewer information and timestamps.
/// </summary>
public class ReviewLeaveRequestCommandHandler : IRequestHandler<ReviewLeaveRequestCommand, LeaveRequestDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ReviewLeaveRequestCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<LeaveRequestDto> Handle(
        ReviewLeaveRequestCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Authorize: Must have Leave.Approve or be SuperAdmin/HrManager
        var canApprove = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                         _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                         _currentUserService.HasPermission(UserConsts.Permissions.LeaveApprove);

        if (!canApprove)
        {
            throw new ForbiddenException("Bạn không có quyền hạn phê duyệt hoặc từ chối đơn xin nghỉ phép.");
        }

        // 2. Find request
        var leaveRequest = await _context.LeaveRequests
            .Include(lr => lr.Employee)
                .ThenInclude(e => e.Department)
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == request.RequestId, cancellationToken);

        if (leaveRequest is null)
        {
            throw new NotFoundException("Đơn xin nghỉ phép", request.RequestId);
        }

        if (leaveRequest.Status != LeaveConsts.LeaveStatuses.Pending)
        {
            throw new BadRequestException($"Đơn nghỉ phép này đã được xử lý ở trạng thái '{leaveRequest.Status}', không thể thay đổi tiếp.");
        }

        // 3. Find LeaveBalance
        var year = leaveRequest.StartDate.Year;
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(lb => lb.EmployeeId == leaveRequest.EmployeeId &&
                                       lb.LeaveTypeId == leaveRequest.LeaveTypeId &&
                                       lb.LeaveYear == year, cancellationToken);

        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            var nowUtc = DateTime.UtcNow;

            if (request.IsApproved)
            {
                leaveRequest.Status = LeaveConsts.LeaveStatuses.Approved;
                if (balance != null)
                {
                    balance.PendingDays = Math.Max(0, balance.PendingDays - leaveRequest.TotalDays);
                    balance.UsedDays += leaveRequest.TotalDays;
                    balance.UpdatedAt = nowUtc;
                }
            }
            else
            {
                leaveRequest.Status = LeaveConsts.LeaveStatuses.Rejected;
                if (balance != null)
                {
                    // Release pending days back to available quota
                    balance.PendingDays = Math.Max(0, balance.PendingDays - leaveRequest.TotalDays);
                    balance.UpdatedAt = nowUtc;
                }
            }

            leaveRequest.ReviewedByEmployeeId = _currentUserService.EmployeeId;
            leaveRequest.ReviewedAt = nowUtc;
            leaveRequest.ReviewComment = request.ReviewComment?.Trim();
            leaveRequest.UpdatedAt = nowUtc;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        });

        string? reviewerName = null;
        if (leaveRequest.ReviewedByEmployeeId.HasValue)
        {
            var reviewer = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == leaveRequest.ReviewedByEmployeeId.Value, cancellationToken);
            reviewerName = reviewer?.FullName;
        }

        return new LeaveRequestDto(
            leaveRequest.Id,
            leaveRequest.RequestCode,
            leaveRequest.EmployeeId,
            leaveRequest.Employee.FullName,
            leaveRequest.Employee.EmployeeCode,
            leaveRequest.Employee.Department?.DepartmentName,
            leaveRequest.LeaveType.Id,
            leaveRequest.LeaveType.LeaveTypeCode,
            leaveRequest.LeaveType.LeaveTypeName,
            leaveRequest.LeaveType.IsPaid,
            leaveRequest.StartDate,
            leaveRequest.EndDate,
            leaveRequest.TotalDays,
            leaveRequest.Reason,
            leaveRequest.AttachmentUrl,
            leaveRequest.Status,
            leaveRequest.ReviewedByEmployeeId,
            reviewerName,
            leaveRequest.ReviewedAt,
            leaveRequest.ReviewComment,
            leaveRequest.CreatedAt);
    }
}

