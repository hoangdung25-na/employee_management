using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Leaves.DTOs;
using EmployeeManagement.Domain.Codes.Consts;
using EmployeeManagement.Domain.Codes.Entities;
using EmployeeManagement.Domain.Leaves.Consts;
using EmployeeManagement.Domain.Leaves.Entities;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Commands.CreateLeaveRequest;

/// <summary>
/// Command handler for submitting a leave request:
/// 1. Checks and locks the employee's LeaveBalance for the target year.
/// 2. Ensures sufficient remaining leave quota (remaining >= TotalDays).
/// 3. Safely increments PendingDays.
/// 4. Generates sequential code (LR-YYYY-xxx).
/// </summary>
public class CreateLeaveRequestCommandHandler : IRequestHandler<CreateLeaveRequestCommand, LeaveRequestDto>
{
    private const int MaxConcurrencyRetries = 3;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateLeaveRequestCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<LeaveRequestDto> Handle(
        CreateLeaveRequestCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Resolve employee
        var employeeId = request.TargetEmployeeId ?? _currentUserService.EmployeeId;
        if (!employeeId.HasValue || employeeId.Value == Guid.Empty)
        {
            throw new BadRequestException("Tài khoản chưa được liên kết với hồ sơ nhân sự.");
        }

        // Anti-IDOR check
        if (request.TargetEmployeeId.HasValue &&
            request.TargetEmployeeId.Value != _currentUserService.EmployeeId)
        {
            var canManage = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                            _currentUserService.HasPermission(UserConsts.Permissions.LeaveApprove);

            if (!canManage)
            {
                throw new ForbiddenException("Bạn không có quyền nộp đơn xin nghỉ phép hộ nhân viên khác.");
            }
        }

        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == employeeId.Value, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", employeeId.Value);
        }

        // 2. Validate Leave Type
        var leaveType = await _context.LeaveTypes
            .FirstOrDefaultAsync(lt => lt.Id == request.LeaveTypeId && lt.IsActive, cancellationToken);

        if (leaveType is null)
        {
            throw new NotFoundException("Loại nghỉ phép", request.LeaveTypeId);
        }

        if (leaveType.RequiresAttachment && string.IsNullOrWhiteSpace(request.AttachmentUrl))
        {
            throw new BadRequestException($"Loại nghỉ phép '{leaveType.LeaveTypeName}' bắt buộc phải đính kèm minh chứng / tài liệu y tế.");
        }

        // 3. Validate dates
        if (request.EndDate < request.StartDate)
        {
            throw new BadRequestException("Ngày kết thúc nghỉ phép phải sau hoặc cùng ngày với ngày bắt đầu.");
        }

        if (request.TotalDays <= 0)
        {
            throw new BadRequestException("Tổng số ngày nghỉ phép phải lớn hơn 0.");
        }

        var currentYear = request.StartDate.Year;

        // 4. Validate and update LeaveBalance
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(lb => lb.EmployeeId == employeeId.Value &&
                                       lb.LeaveTypeId == request.LeaveTypeId &&
                                       lb.LeaveYear == currentYear, cancellationToken);

        if (balance is null)
        {
            // Auto-initialize balance for this employee and year if not exist
            balance = new LeaveBalance
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId.Value,
                LeaveTypeId = request.LeaveTypeId,
                LeaveYear = currentYear,
                EntitledDays = leaveType.DefaultDaysPerYear,
                CarriedOverDays = 0m,
                UsedDays = 0m,
                PendingDays = 0m,
                CreatedAt = DateTime.UtcNow
            };
            await _context.LeaveBalances.AddAsync(balance, cancellationToken);
        }

        // Compute remaining quota
        var effectiveRemaining = (balance.EntitledDays + balance.CarriedOverDays) - (balance.UsedDays + balance.PendingDays);
        if (effectiveRemaining < request.TotalDays)
        {
            throw new BadRequestException(
                $"Quỹ phép còn lại ({effectiveRemaining} ngày) không đủ cho đơn xin nghỉ ({request.TotalDays} ngày). Vui lòng điều chỉnh lại.");
        }

        // 5. Code sequence generation (LR-YYYY-xxx)
        var prefix = $"LR-{currentYear}-";
        var sequenceKey = $"{CodeConsts.LeaveRequestCodeType}-{currentYear}";

        for (var attempt = 1; attempt <= MaxConcurrencyRetries; attempt++)
        {
            try
            {
                var codeSequence = await _context.CodeSequences
                    .FirstOrDefaultAsync(c => c.Id == sequenceKey, cancellationToken);

                if (codeSequence is null)
                {
                    var existingCount = await _context.LeaveRequests
                        .IgnoreQueryFilters()
                        .CountAsync(lr => lr.RequestCode.StartsWith(prefix), cancellationToken);

                    codeSequence = new CodeSequence(sequenceKey, existingCount);
                    await _context.CodeSequences.AddAsync(codeSequence, cancellationToken);
                }

                string finalRequestCode;
                do
                {
                    finalRequestCode = codeSequence.GenerateNextCode(prefix, 3);
                }
                while (await _context.LeaveRequests
                    .IgnoreQueryFilters()
                    .AnyAsync(lr => lr.RequestCode == finalRequestCode, cancellationToken));

                var strategy = _context.Database.CreateExecutionStrategy();
                LeaveRequest leaveRequest = null!;

                await strategy.ExecuteAsync(async () =>
                {
                    await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                    // Deduct from available quota by increasing PendingDays
                    balance.PendingDays += request.TotalDays;
                    balance.UpdatedAt = DateTime.UtcNow;

                    leaveRequest = new LeaveRequest
                    {
                        Id = Guid.NewGuid(),
                        RequestCode = finalRequestCode,
                        EmployeeId = employeeId.Value,
                        LeaveTypeId = request.LeaveTypeId,
                        StartDate = request.StartDate,
                        EndDate = request.EndDate,
                        TotalDays = request.TotalDays,
                        Reason = request.Reason.Trim(),
                        AttachmentUrl = request.AttachmentUrl?.Trim(),
                        Status = LeaveConsts.LeaveStatuses.Pending,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.LeaveRequests.AddAsync(leaveRequest, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                });

                return new LeaveRequestDto(
                    leaveRequest.Id,
                    leaveRequest.RequestCode,
                    leaveRequest.EmployeeId,
                    employee.FullName,
                    employee.EmployeeCode,
                    employee.Department?.DepartmentName,
                    leaveType.Id,
                    leaveType.LeaveTypeCode,
                    leaveType.LeaveTypeName,
                    leaveType.IsPaid,
                    leaveRequest.StartDate,
                    leaveRequest.EndDate,
                    leaveRequest.TotalDays,
                    leaveRequest.Reason,
                    leaveRequest.AttachmentUrl,
                    leaveRequest.Status,
                    leaveRequest.ReviewedByEmployeeId,
                    null,
                    leaveRequest.ReviewedAt,
                    leaveRequest.ReviewComment,
                    leaveRequest.CreatedAt);
            }
            catch (DbUpdateException) when (attempt < MaxConcurrencyRetries)
            {
                await Task.Delay(50 * attempt, cancellationToken);
            }
        }

        throw new BadRequestException("Không thể cấp mã đơn nghỉ phép do xung đột dữ liệu đồng thời. Vui lòng thử lại.");
    }
}

