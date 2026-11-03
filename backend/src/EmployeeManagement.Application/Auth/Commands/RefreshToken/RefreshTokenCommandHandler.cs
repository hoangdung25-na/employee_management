using System.Security.Claims;
using EmployeeManagement.Application.Auth.DTOs;
using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Auth.Commands.RefreshToken;

/// <summary>
/// Validates an expired JWT Access Token and its matching Refresh Token, verifies SecurityStamp & account status,
/// and rotates a new Access Token & Refresh Token pair.
/// </summary>
public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private const string InvalidRefreshTokenMessage = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.";

    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var principal = _jwtTokenGenerator.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal is null)
        {
            throw new UnauthorizedException(InvalidRefreshTokenMessage);
        }

        var subClaim = principal.FindFirst("sub")?.Value
                       ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(subClaim, out var userId))
        {
            throw new UnauthorizedException(InvalidRefreshTokenMessage);
        }

        var tokenSecurityStamp = principal.FindFirst("securityStamp")?.Value;

        var user = await _context.Users
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        var nowUtc = DateTime.UtcNow;

        if (user is null ||
            !user.IsActive ||
            (user.IsLocked && user.LockedUntil.HasValue && user.LockedUntil.Value > nowUtc) ||
            (!string.IsNullOrEmpty(tokenSecurityStamp) && !string.Equals(user.SecurityStamp, tokenSecurityStamp, StringComparison.Ordinal)) ||
            !string.Equals(user.RefreshToken, request.RefreshToken.Trim(), StringComparison.Ordinal) ||
            !user.RefreshTokenExpiryTime.HasValue ||
            user.RefreshTokenExpiryTime.Value <= nowUtc)
        {
            throw new UnauthorizedException(InvalidRefreshTokenMessage);
        }

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

        var tokenResult = _jwtTokenGenerator.GenerateAccessToken(user, fullName, roleCodes, permissionCodes);
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
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
            newRefreshToken,
            tokenResult.ExpiresAtUtc);
    }
}
