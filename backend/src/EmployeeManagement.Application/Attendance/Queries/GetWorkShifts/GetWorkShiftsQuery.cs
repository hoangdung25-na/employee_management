using EmployeeManagement.Application.Attendance.DTOs;
using EmployeeManagement.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Attendance.Queries.GetWorkShifts;

/// <summary>
/// Query to retrieve all active work shifts.
/// </summary>
public record GetWorkShiftsQuery : IRequest<IReadOnlyList<WorkShiftDto>>;

public class GetWorkShiftsQueryHandler : IRequestHandler<GetWorkShiftsQuery, IReadOnlyList<WorkShiftDto>>
{
    private readonly IApplicationDbContext _context;

    public GetWorkShiftsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<WorkShiftDto>> Handle(
        GetWorkShiftsQuery request,
        CancellationToken cancellationToken)
    {
        return await _context.WorkShifts
            .AsNoTracking()
            .Where(ws => ws.IsActive)
            .OrderBy(ws => ws.StartTime)
            .Select(ws => new WorkShiftDto(
                ws.Id,
                ws.ShiftCode,
                ws.ShiftName,
                ws.StartTime,
                ws.EndTime,
                ws.BreakMinutes,
                ws.GracePeriodMinutes,
                ws.StandardHours,
                ws.IsNightShift,
                ws.IsActive))
            .ToListAsync(cancellationToken);
    }
}
