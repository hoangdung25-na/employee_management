using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Positions.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Positions.Queries.GetPositions;

/// <summary>
/// Read-only query handler for retrieving the list of job positions.
/// </summary>
public class GetPositionsQueryHandler : IRequestHandler<GetPositionsQuery, IReadOnlyList<PositionResponseDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPositionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<PositionResponseDto>> Handle(
        GetPositionsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Positions
            .AsNoTracking()
            .AsQueryable();

        if (!request.IncludeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        if (request.DepartmentId.HasValue && request.DepartmentId.Value != Guid.Empty)
        {
            var deptId = request.DepartmentId.Value;
            query = query.Where(p => p.DepartmentPositions.Any(dp => dp.DepartmentId == deptId));
        }

        return await query
            .OrderBy(p => p.JobLevel)
            .ThenBy(p => p.PositionName)
            .Select(p => new PositionResponseDto(
                p.Id,
                p.PositionCode,
                p.PositionName,
                p.Description,
                p.IsActive,
                p.JobLevel))
            .ToListAsync(cancellationToken);
    }
}

