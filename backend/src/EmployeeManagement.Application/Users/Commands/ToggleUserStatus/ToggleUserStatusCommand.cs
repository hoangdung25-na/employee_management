using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Users.Commands.ToggleUserStatus;

/// <summary>
/// Command to toggle a User account between Active (Hoạt động) and Suspended (Đình chỉ).
/// Synchronizes linked Employee status and immediately revokes RefreshToken & evicts AuthCache when suspended.
/// </summary>
public record ToggleUserStatusCommand(Guid UserId, bool IsActive) : IRequest<bool>;

public class ToggleUserStatusCommandHandler : IRequestHandler<ToggleUserStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuthCache _authCache;

    public ToggleUserStatusCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuthCache authCache)
    {
        _context = context;
        _currentUserService = currentUserService;
        _authCache = authCache;
    }

    public async Task<bool> Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == request.UserId && !request.IsActive)
        {
            throw new BadRequestException("Bạn không thể tự đình chỉ tài khoản đang đăng nhập của chính mình.");
        }

        var user = await _context.Users
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Không tìm thấy tài khoản người dùng.");

        if (request.IsActive && user.Employee is not null && user.Employee.Status == EmployeeStatus.Terminated)
        {
            throw new BadRequestException("Không thể kích hoạt lại tài khoản của nhân viên đã thôi việc.");
        }

        var nowUtc = DateTime.UtcNow;
        user.IsActive = request.IsActive;
        user.UpdatedAt = nowUtc;

        if (!request.IsActive)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;

            // Two-way sync: if linked employee is Active/Probation, mark as Suspended
            if (user.Employee is not null &&
                (user.Employee.Status == EmployeeStatus.Active || user.Employee.Status == EmployeeStatus.Probation))
            {
                user.Employee.Status = EmployeeStatus.Suspended;
                user.Employee.UpdatedAt = nowUtc;
            }
        }
        else
        {
            // When re-activating a user, clear any brute-force lockout and restore Suspended employee to Active
            user.IsLocked = false;
            user.LockedUntil = null;
            user.FailedLoginAttempts = 0;

            if (user.Employee is not null && user.Employee.Status == EmployeeStatus.Suspended)
            {
                user.Employee.Status = EmployeeStatus.Active;
                user.Employee.UpdatedAt = nowUtc;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Immediately evict cached permissions so suspension/reactivation takes effect on the very next request
        _authCache.InvalidateUser(user.Id);

        return true;
    }
}

