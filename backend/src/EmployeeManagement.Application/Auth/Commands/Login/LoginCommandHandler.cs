using EmployeeManagement.Application.Auth.DTOs;
using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Auth.Commands.Login;

/// <summary>
/// Handles user authentication, brute-force account lockout (5 attempts -> 30 minutes lock),
/// and issues JWT Access Token & Refresh Token with 5-Role RBAC + ESS employeeId claims.
/// </summary>
public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private const string InvalidCredentialsMessage = "Tên đăng nhập hoặc mật khẩu không chính xác.";

    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var identifier = request.UsernameOrEmail.Trim();

        // 1. Load User with 1-0..1 Employee profile
        var user = await _context.Users
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(
                u => u.Username == identifier || u.Email == identifier,
                cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedException(InvalidCredentialsMessage);
        }

        // 2. Check if account is deactivated (e.g. Terminated employee)
        if (!user.IsActive)
        {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa do chấm dứt hợp đồng lao động hoặc bị thu hồi quyền truy cập.");
        }

        var nowUtc = DateTime.UtcNow;

        // 3. Check brute-force lockout status
        if (user.IsLocked)
        {
            if (user.LockedUntil.HasValue && user.LockedUntil.Value > nowUtc)
            {
                var remainingMinutes = Math.Max(1, (int)Math.Ceiling((user.LockedUntil.Value - nowUtc).TotalMinutes));
                throw new UnauthorizedException($"Tài khoản đang tạm khóa do nhập sai mật khẩu quá {UserConsts.MaxFailedLoginAttempts} lần. Vui lòng thử lại sau {remainingMinutes} phút.");
            }

            // Lockout period has expired -> auto-unlock
            user.IsLocked = false;
            user.LockedUntil = null;
            user.FailedLoginAttempts = 0;
        }

        // 4. Verify BCrypt password hash
        var isPasswordValid = _passwordHasher.VerifyHashedPassword(user.PasswordHash, request.Password);
        if (!isPasswordValid)
        {
            user.FailedLoginAttempts += 1;
            user.UpdatedAt = nowUtc;

            if (user.FailedLoginAttempts >= UserConsts.MaxFailedLoginAttempts)
            {
                user.IsLocked = true;
                user.LockedUntil = nowUtc.AddMinutes(UserConsts.DefaultLockoutMinutes);
                await _context.SaveChangesAsync(cancellationToken);

                throw new UnauthorizedException($"Tài khoản đã bị tạm khóa {UserConsts.DefaultLockoutMinutes} phút do nhập sai mật khẩu {UserConsts.MaxFailedLoginAttempts} lần liên tiếp.");
            }

            await _context.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException(InvalidCredentialsMessage);
        }

        // 5. Reset failed attempts on successful login
        user.FailedLoginAttempts = 0;
        user.IsLocked = false;
        user.LockedUntil = null;

        // 6. Project active Roles and atomic Permissions (AsNoTracking read-only projection per API_PERFORMANCE_RULES.md)
        var roleData = await _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == user.Id && ur.Role.IsActive)
            .Select(ur => new
            {
                ur.Role.RoleCode,
                Permissions = ur.Role.RolePermissions.Select(rp => rp.Permission.PermissionCode)
            })
            .ToListAsync(cancellationToken);

        var roleCodes = roleData
            .Select(r => r.RoleCode)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var permissionCodes = roleData
            .SelectMany(r => r.Permissions)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(p => p)
            .ToList();

        var fullName = user.Employee?.FullName ?? "Quản trị viên Hệ thống";
        var avatarUrl = user.Employee?.AvatarUrl;

        // 7. Generate JWT Access Token & Refresh Token
        var tokenResult = _jwtTokenGenerator.GenerateAccessToken(user, fullName, roleCodes, permissionCodes);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = nowUtc.AddDays(_jwtTokenGenerator.GetRefreshTokenExpirationDays());
        user.UpdatedAt = nowUtc;

        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            user.Id,
            user.EmployeeId,
            user.Username,
            user.Email,
            fullName,
            avatarUrl,
            user.MustChangePassword,
            roleCodes,
            permissionCodes,
            tokenResult.AccessToken,
            refreshToken,
            tokenResult.ExpiresAtUtc);
    }
}
