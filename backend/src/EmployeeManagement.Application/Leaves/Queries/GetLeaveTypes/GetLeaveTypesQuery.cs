using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Leaves.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Queries.GetLeaveTypes;

/// <summary>
/// Query to retrieve all active leave types.
/// </summary>
public record GetLeaveTypesQuery : IRequest<IReadOnlyList<LeaveTypeDto>>;

public class GetLeaveTypesQueryHandler : IRequestHandler<GetLeaveTypesQuery, IReadOnlyList<LeaveTypeDto>>
{
    private readonly IApplicationDbContext _context;

    public GetLeaveTypesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<LeaveTypeDto>> Handle(
        GetLeaveTypesQuery request,
        CancellationToken cancellationToken)
    {
        return await _context.LeaveTypes
            .AsNoTracking()
            .Where(lt => lt.IsActive)
            .OrderBy(lt => lt.LeaveTypeCode)
            .Select(lt => new LeaveTypeDto(
                lt.Id,
                lt.LeaveTypeCode,
                lt.LeaveTypeName,
                lt.DefaultDaysPerYear,
                lt.IsPaid,
                lt.RequiresAttachment,
                lt.Description,
                lt.IsActive))
            .ToListAsync(cancellationToken);
    }
}

