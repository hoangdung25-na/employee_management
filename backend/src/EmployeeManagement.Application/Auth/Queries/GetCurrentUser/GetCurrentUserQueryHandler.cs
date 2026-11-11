using EmployeeManagement.Application.Auth.DTOs;
using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Auth.Queries.GetCurrentUser;

/// <summary>
/// Read-only query handler returning the current user's profile, linked Employee details, Roles, and Permissions.
/// Uses AsNoTracking and direct projection to avoid over-fetching and Cartesian explosion.
/// </summary>
public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, CurrentUserDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuthCache _authCache;

    public GetCurrentUserQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuthCache authCache)
    {
        _context = context;
        _currentUserService = currentUserService;
        _authCache = authCache;
    }

    public async Task<CurrentUserDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");
        }

        var userId = _currentUserService.UserId.Value;

        var userProjection = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.Id,
                u.EmployeeId,
                u.Username,
                u.Email,
                u.IsActive,
                u.MustChangePassword,
                FullName = u.Employee != null ? u.Employee.FullName : null,
                DepartmentName = u.Employee != null ? u.Employee.Department.DepartmentName : null,
                PositionName = u.Employee != null ? u.Employee.Position.PositionName : null,
                AvatarUrl = u.Employee != null ? u.Employee.AvatarUrl : null
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (userProjection is null || !userProjection.IsActive)
        {
            _authCache.InvalidateUser(userId);
            throw new UnauthorizedException("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
        }

        // Retrieve Roles & Permissions from AuthCache (loads from DB only on cache miss)
        var cachedAuth = await _authCache.GetOrSetUserAuthAsync(userId, cancellationToken);
        if (cachedAuth is null || !cachedAuth.IsActive)
        {
            throw new UnauthorizedException("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
        }

        var roleCodes = cachedAuth.Roles
            .OrderBy(r => r)
            .ToList();

        var permissionCodes = cachedAuth.Permissions
            .OrderBy(p => p)
            .ToList();

        return new CurrentUserDto(
            userProjection.Id,
            userProjection.EmployeeId,
            userProjection.Username,
            userProjection.Email,
            userProjection.FullName ?? "Quản trị viên Hệ thống",
            userProjection.DepartmentName,
            userProjection.PositionName,
            userProjection.AvatarUrl,
            userProjection.MustChangePassword,
            roleCodes,
            permissionCodes);
    }
}
