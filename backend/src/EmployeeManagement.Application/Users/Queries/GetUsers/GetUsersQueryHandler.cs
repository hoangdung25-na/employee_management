using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Users.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Users.Queries.GetUsers;

/// <summary>
/// Read-only query handler for paginated user listing.
/// Uses AsNoTracking and direct projection per API_PERFORMANCE_RULES.md.
/// </summary>
public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, PagedResult<UserSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUsersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UserSummaryDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                (u.Employee != null && (
                    u.Employee.FullName.ToLower().Contains(term) ||
                    u.Employee.EmployeeCode.ToLower().Contains(term))));
        }

        if (!string.IsNullOrWhiteSpace(request.RoleCode))
        {
            var roleCode = request.RoleCode.Trim().ToUpper();
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.RoleCode == roleCode));
        }

        if (request.IsActive.HasValue)
        {
            var isActive = request.IsActive.Value;
            query = query.Where(u => u.IsActive == isActive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var rawItems = await query
            .OrderByDescending(u => u.CreatedAt)
            .ThenBy(u => u.Username)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new
            {
                u.Id,
                u.EmployeeId,
                EmployeeCode = u.Employee != null ? u.Employee.EmployeeCode : "ADM",
                u.Username,
                FullName = u.Employee != null ? u.Employee.FullName : "Quản trị viên Hệ thống",
                u.Email,
                DepartmentName = u.Employee != null ? u.Employee.Department.DepartmentName : "Hệ thống",
                PositionName = u.Employee != null ? u.Employee.Position.PositionName : "Quản trị viên",
                Roles = u.UserRoles
                    .Where(ur => ur.Role.IsActive)
                    .Select(ur => new
                    {
                        ur.Role.RoleCode,
                        ur.Role.RoleName,
                        Permissions = ur.Role.RolePermissions.Select(rp => rp.Permission.PermissionCode)
                    })
                    .ToList(),
                u.CustomPermissions,
                u.IsActive,
                u.IsLocked,
                u.LockedUntil,
                u.MustChangePassword,
                u.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var items = rawItems
            .Select(u =>
            {
                var roleCodes = u.Roles.Select(r => r.RoleCode).OrderBy(r => r).ToList();
                var roleNames = u.Roles.Select(r => r.RoleName).OrderBy(r => r).ToList();
                var effectivePermissions = PermissionNames.ResolveEffectivePermissions(
                    u.CustomPermissions,
                    roleCodes,
                    u.Roles.SelectMany(r => r.Permissions),
                    u.Username);

                return new UserSummaryDto(
                    u.Id,
                    u.EmployeeId,
                    u.EmployeeCode,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.DepartmentName,
                    u.PositionName,
                    roleCodes,
                    roleNames,
                    effectivePermissions,
                    u.IsActive,
                    u.IsLocked && (!u.LockedUntil.HasValue || u.LockedUntil.Value > DateTime.UtcNow),
                    u.LockedUntil,
                    u.MustChangePassword,
                    u.CreatedAt);
            })
            .ToList();

        return new PagedResult<UserSummaryDto>(
            items,
            totalCount,
            request.PageNumber,
            request.PageSize);
    }
}
