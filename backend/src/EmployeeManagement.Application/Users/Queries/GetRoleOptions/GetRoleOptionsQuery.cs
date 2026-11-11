using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Users.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Users.Queries.GetRoleOptions;

/// <summary>
/// Retrieves active system roles along with each role's default atomic permissions.
/// </summary>
public record GetRoleOptionsQuery : IRequest<IReadOnlyList<RoleOptionDto>>;

public class GetRoleOptionsQueryHandler : IRequestHandler<GetRoleOptionsQuery, IReadOnlyList<RoleOptionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetRoleOptionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<RoleOptionDto>> Handle(GetRoleOptionsQuery request, CancellationToken cancellationToken)
    {
        var rawRoles = await _context.Roles
            .AsNoTracking()
            .Where(r => r.IsActive)
            .OrderBy(r => r.RoleCode)
            .Select(r => new
            {
                r.Id,
                r.RoleCode,
                r.RoleName,
                r.Description,
                Permissions = r.RolePermissions.Select(rp => rp.Permission.PermissionCode).ToList()
            })
            .ToListAsync(cancellationToken);

        var allPermissions = PermissionNames.GetAll();
        var validSet = new HashSet<string>(allPermissions, StringComparer.OrdinalIgnoreCase);

        return rawRoles
            .Select(r => new RoleOptionDto(
                r.Id,
                r.RoleCode,
                r.RoleName,
                r.Description,
                string.Equals(r.RoleCode, AppRoles.SuperAdmin, StringComparison.OrdinalIgnoreCase)
                    ? allPermissions
                    : r.Permissions
                        .Where(p => validSet.Contains(p))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(p => p)
                        .ToList()))
            .ToList();
    }
}
