using EmployeeManagement.Application.Attendance.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Attendance.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Attendance.Queries.GetAttendanceHistory;

/// <summary>
/// Query handler retrieving attendance logs for a specific month/year.
/// Enforces ESS data privacy (regular employees only see their own attendance logs).
/// </summary>
public class GetAttendanceHistoryQueryHandler : IRequestHandler<GetAttendanceHistoryQuery, AttendanceHistoryResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAttendanceHistoryQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AttendanceHistoryResponseDto> Handle(
        GetAttendanceHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var canManageAll = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                           _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                           _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                           _currentUserService.HasPermission(UserConsts.Permissions.AttendanceManage);

        var targetEmployeeId = request.EmployeeId;

        // If not manager or HR, enforce row-level security: only see self
        if (!canManageAll)
        {
            targetEmployeeId = _currentUserService.EmployeeId;
        }

        var startDate = new DateOnly(request.Year, request.Month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var query = _context.AttendanceLogs
            .AsNoTracking()
            .Include(al => al.Employee)
            .Include(al => al.WorkShift)
            .Where(al => al.AttendanceDate >= startDate && al.AttendanceDate <= endDate);

        if (targetEmployeeId.HasValue && targetEmployeeId.Value != Guid.Empty)
        {
            query = query.Where(al => al.EmployeeId == targetEmployeeId.Value);
        }
        else if (request.DepartmentId.HasValue)
        {
            query = query.Where(al => al.Employee.DepartmentId == request.DepartmentId.Value);
        }

        var items = await query
            .OrderByDescending(al => al.AttendanceDate)
            .ThenBy(al => al.Employee.FullName)
            .Select(al => new AttendanceLogDto(
                al.Id,
                al.EmployeeId,
                al.Employee.FullName,
                al.Employee.EmployeeCode,
                al.WorkShiftId,
                al.WorkShift.ShiftName,
                al.WorkShift.ShiftCode,
                al.AttendanceDate,
                al.CheckInTime,
                al.CheckOutTime,
                al.CheckInMethod,
                al.CheckInIpAddress,
                al.WorkingHours,
                al.OvertimeHours,
                al.LateMinutes,
                al.EarlyLeaveMinutes,
                al.Status,
                al.Notes))
            .ToListAsync(cancellationToken);

        // Calculate summary statistics
        var totalPresent = items.Count(i => i.Status == AttendanceConsts.AttendanceStatuses.Present || i.Status == AttendanceConsts.AttendanceStatuses.Late);
        var totalLate = items.Count(i => i.Status == AttendanceConsts.AttendanceStatuses.Late || i.LateMinutes > 0);
        var totalEarlyLeave = items.Count(i => i.Status == AttendanceConsts.AttendanceStatuses.EarlyLeave || i.EarlyLeaveMinutes > 0);
        var totalOnLeave = items.Count(i => i.Status == AttendanceConsts.AttendanceStatuses.OnLeave);
        var totalWorkingHours = items.Sum(i => i.WorkingHours);
        var totalOvertimeHours = items.Sum(i => i.OvertimeHours);

        return new AttendanceHistoryResponseDto(
            request.Month,
            request.Year,
            totalPresent,
            totalLate,
            totalEarlyLeave,
            totalOnLeave,
            totalWorkingHours,
            totalOvertimeHours,
            items);
    }
}

