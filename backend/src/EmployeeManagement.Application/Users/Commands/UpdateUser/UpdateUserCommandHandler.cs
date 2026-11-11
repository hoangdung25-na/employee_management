using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Users.DTOs;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Employees.Enums;
using EmployeeManagement.Domain.Users.Consts;
using EmployeeManagement.Domain.Users.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Users.Commands.UpdateUser;

/// <summary>
/// Updates User account details, synchronizes UserRoles and CustomPermissions, optionally resets password / unlocks account,
/// and immediately invalidates AuthCache so updated permissions take effect without delay.
/// </summary>
public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, UserSummaryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuthCache _authCache;

    public UpdateUserCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUserService,
        IAuthCache authCache)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
        _authCache = authCache;
    }

    public async Task<UserSummaryDto> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Không tìm thấy tài khoản người dùng.");

        if (_currentUserService.UserId == user.Id && !request.IsActive)
        {
            throw new BadRequestException("Bạn không thể tự đình chỉ tài khoản đang đăng nhập của chính mình.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var emailExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id != user.Id && u.Email.ToLower() == email, cancellationToken);

        if (emailExists)
        {
            throw new ConflictException($"Địa chỉ Email '{email}' đã được sử dụng cho một tài khoản khác.");
        }

        string employeeCode = "ADM";
        string fullName = "Quản trị viên Hệ thống";
        string? departmentName = "Hệ thống";
        string? positionName = "Quản trị viên";
        Employee? linkedEmployee = null;

        if (request.EmployeeId.HasValue)
        {
            var employeeLinked = await _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id != user.Id && u.EmployeeId == request.EmployeeId.Value, cancellationToken);

            if (employeeLinked)
            {
                throw new ConflictException("Nhân viên này đã được liên kết với một tài khoản người dùng khác.");
            }

            linkedEmployee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Position)
                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId.Value, cancellationToken)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ nhân viên được chọn.");

            if (request.IsActive && linkedEmployee.Status == EmployeeStatus.Terminated)
            {
                throw new BadRequestException("Không thể kích hoạt tài khoản của nhân viên đã thôi việc.");
            }

            if (!string.Equals(linkedEmployee.WorkEmail, email, StringComparison.OrdinalIgnoreCase))
            {
                var workEmailConflict = await _context.Employees
                    .AsNoTracking()
                    .AnyAsync(e => e.Id != linkedEmployee.Id && e.WorkEmail.ToLower() == email, cancellationToken);

                if (workEmailConflict)
                {
                    throw new ConflictException($"Email '{email}' đã trùng với Email công việc của một nhân viên khác.");
                }

                linkedEmployee.WorkEmail = email;
                linkedEmployee.UpdatedAt = DateTime.UtcNow;
            }

            if (!request.IsActive &&
                (linkedEmployee.Status == EmployeeStatus.Active || linkedEmployee.Status == EmployeeStatus.Probation))
            {
                linkedEmployee.Status = EmployeeStatus.Suspended;
                linkedEmployee.UpdatedAt = DateTime.UtcNow;
            }
            else if (request.IsActive && linkedEmployee.Status == EmployeeStatus.Suspended)
            {
                linkedEmployee.Status = EmployeeStatus.Active;
                linkedEmployee.UpdatedAt = DateTime.UtcNow;
            }

            employeeCode = linkedEmployee.EmployeeCode;
            fullName = linkedEmployee.FullName;
            departmentName = linkedEmployee.Department.DepartmentName;
            positionName = linkedEmployee.Position.PositionName;
        }

        var normalizedRoleCodes = request.RoleCodes
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();

        var roles = await _context.Roles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .Where(r => r.IsActive && normalizedRoleCodes.Contains(r.RoleCode.ToUpper()))
            .ToListAsync(cancellationToken);

        if (roles.Count == 0)
        {
            throw new BadRequestException("Vai trò (Role) được chọn không hợp lệ.");
        }

        var validSystemPermissions = new HashSet<string>(
            PermissionNames.GetAll(),
            StringComparer.OrdinalIgnoreCase);

        if (request.CustomPermissions is not null)
        {
            var sanitized = request.CustomPermissions
                .Where(p => !string.IsNullOrWhiteSpace(p) && validSystemPermissions.Contains(p.Trim()))
                .Select(p => p.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
                .ToList();

            user.CustomPermissions = string.Join(",", sanitized);
        }

        var nowUtc = DateTime.UtcNow;

        user.Email = email;
        user.EmployeeId = request.EmployeeId;
        user.IsActive = request.IsActive;
        user.MustChangePassword = request.MustChangePassword;
        user.UpdatedAt = nowUtc;

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.SecurityStamp = Guid.NewGuid().ToString("N");
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
        }

        if (request.UnlockAccount || !string.IsNullOrWhiteSpace(request.NewPassword))
        {
            user.IsLocked = false;
            user.LockedUntil = null;
            user.FailedLoginAttempts = 0;
        }

        if (!request.IsActive)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
        }

        // Replace UserRoles
        _context.UserRoles.RemoveRange(user.UserRoles);
        user.UserRoles.Clear();
        foreach (var role in roles)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id,
                AssignedAt = nowUtc
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Immediately evict cached permissions so role/permission/status changes take effect right away
        _authCache.InvalidateUser(user.Id);

        var roleCodes = roles.Select(r => r.RoleCode).OrderBy(r => r).ToList();
        var effectivePermissions = PermissionNames.ResolveEffectivePermissions(
            user.CustomPermissions,
            roleCodes,
            roles.SelectMany(r => r.RolePermissions.Select(rp => rp.Permission.PermissionCode)),
            user.Username);

        return new UserSummaryDto(
            user.Id,
            user.EmployeeId,
            employeeCode,
            user.Username,
            fullName,
            user.Email,
            departmentName,
            positionName,
            roleCodes,
            roles.Select(r => r.RoleName).OrderBy(r => r).ToList(),
            effectivePermissions,
            user.IsActive,
            user.IsLocked && (!user.LockedUntil.HasValue || user.LockedUntil.Value > nowUtc),
            user.LockedUntil,
            user.MustChangePassword,
            user.CreatedAt);
    }
}
