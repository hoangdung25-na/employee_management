using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Users.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using EmployeeManagement.Domain.Users.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Users.Commands.CreateUser;

/// <summary>
/// Handles creating a new system User account, hashing password with BCrypt, assigning RBAC roles, and saving custom permissions.
/// </summary>
public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, UserSummaryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserSummaryDto> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        var usernameExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Username.ToLower() == username.ToLower(), cancellationToken);

        if (usernameExists)
        {
            throw new ConflictException($"Tên tài khoản '{username}' đã tồn tại trong hệ thống.");
        }

        var emailExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email.ToLower() == email, cancellationToken);

        if (emailExists)
        {
            throw new ConflictException($"Địa chỉ Email '{email}' đã được sử dụng cho một tài khoản khác.");
        }

        string employeeCode = "ADM";
        string fullName = "Quản trị viên Hệ thống";
        string? departmentName = "Hệ thống";
        string? positionName = "Quản trị viên";

        if (request.EmployeeId.HasValue)
        {
            var employeeLinked = await _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.EmployeeId == request.EmployeeId.Value, cancellationToken);

            if (employeeLinked)
            {
                throw new ConflictException("Nhân viên này đã được liên kết với một tài khoản người dùng khác.");
            }

            var empEntity = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Position)
                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId.Value, cancellationToken)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ nhân viên được chọn.");

            if (!string.Equals(empEntity.WorkEmail, email, StringComparison.OrdinalIgnoreCase))
            {
                var workEmailConflict = await _context.Employees
                    .AsNoTracking()
                    .AnyAsync(e => e.Id != empEntity.Id && e.WorkEmail.ToLower() == email, cancellationToken);

                if (workEmailConflict)
                {
                    throw new ConflictException($"Email '{email}' đã trùng với Email công việc của một nhân viên khác.");
                }

                empEntity.WorkEmail = email;
                empEntity.UpdatedAt = DateTime.UtcNow;
            }

            employeeCode = empEntity.EmployeeCode;
            fullName = empEntity.FullName;
            departmentName = empEntity.Department.DepartmentName;
            positionName = empEntity.Position.PositionName;
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

        string? customPermissionsCsv = null;
        if (request.CustomPermissions is not null)
        {
            var sanitized = request.CustomPermissions
                .Where(p => !string.IsNullOrWhiteSpace(p) && validSystemPermissions.Contains(p.Trim()))
                .Select(p => p.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
                .ToList();

            customPermissionsCsv = string.Join(",", sanitized);
        }

        var nowUtc = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            SecurityStamp = Guid.NewGuid().ToString("N"),
            EmployeeId = request.EmployeeId,
            CustomPermissions = customPermissionsCsv,
            IsActive = request.IsActive,
            IsLocked = false,
            FailedLoginAttempts = 0,
            MustChangePassword = request.MustChangePassword,
            CreatedAt = nowUtc
        };

        foreach (var role in roles)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id,
                AssignedAt = nowUtc
            });
        }

        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

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
            user.IsLocked,
            user.LockedUntil,
            user.MustChangePassword,
            user.CreatedAt);
    }
}
