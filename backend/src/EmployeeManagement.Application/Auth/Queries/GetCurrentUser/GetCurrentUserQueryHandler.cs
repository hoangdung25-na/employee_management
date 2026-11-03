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

    public GetCurrentUserQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
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
            throw new UnauthorizedException("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
        }

        var roleData = await _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == userId && ur.Role.IsActive)
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
