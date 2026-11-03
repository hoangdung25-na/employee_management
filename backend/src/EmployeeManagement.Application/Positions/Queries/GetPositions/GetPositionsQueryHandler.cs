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

        return await query
            .OrderBy(p => p.PositionCode)
            .Select(p => new PositionResponseDto(
                p.Id,
                p.PositionCode,
                p.PositionName,
                p.Description,
                p.IsActive))
            .ToListAsync(cancellationToken);
    }
}

